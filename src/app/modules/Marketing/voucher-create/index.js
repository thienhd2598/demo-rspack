import { useMutation, useQuery } from '@apollo/client';
import { Form, Formik } from "formik";
import queryString from 'querystring';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { useSubheader } from '../../../../_metronic/layout/_core/MetronicSubheader';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import mutate_mktSaveCampaign from '../../../../graphql/mutate_mktSaveCampaign';
import LoadingDialog from '../../ProductsStore/products-list-draf/dialog/LoadingDialog';
import ModalAddProducts from '../dialog/ModalAddProducts';
import { VoucherProvider, useVoucherContext } from '../contexts/VoucherContext';
import InfoVoucher from '../components/InfoVoucher';
import ConfigVoucher from '../components/ConfigVoucher';
import TableVoucher from '../components/TableVoucher';
import { randomString } from '../../../../utils';
import { TYPE_VOUCHER } from '../Constants';
import dayjs from 'dayjs';
import query_mktFindCampaign from '../../../../graphql/query_mktFindCampaign';

const VoucherCreate = () => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();    
    const { initialValues, validateSchema, paramsQuery, storeOptions, productsVoucher, setProductsVoucher, buildInitialValues } = useVoucherContext();
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [timeVoucher, setTimeVoucher] = useState({
        id: randomString(),
        error: formatMessage({ defaultMessage: 'Vui lòng chọn thời gian sử dụng' }),
        values: []
    });
    const [collectTime, setCollectTime] = useState({
        id: randomString(),
        error: null,
        value: null,
    })

    const { data: campaignDetail, loading: loadingDetail } = useQuery(query_mktFindCampaign, {
        variables: { id: Number(paramsQuery?.id) },
        fetchPolicy: 'cache-and-network',
        skip: !paramsQuery?.id
    });

    useEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Tạo chương trình khuyến mãi' }) },
            { title: paramsQuery?.typeCampaign ? TYPE_VOUCHER[paramsQuery?.typeCampaign] : '' },
        ]);
    }, [paramsQuery?.typeCampaign]);

    const [createCampaign, { loading: loadingCreateCampaign }] = useMutation(mutate_mktSaveCampaign, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
    });

    useMemo(() => {
        if (paramsQuery?.action != 'copy') return;

        if (!!campaignDetail?.mktFindCampaign?.start_time && !!campaignDetail?.mktFindCampaign?.end_time) {
            setTimeVoucher({
                id: randomString(),
                values: [
                    new Date(dayjs().add(30, 'minute').unix() * 1000),
                    new Date(dayjs().add(90, 'minute').unix() * 1000),                    
                ],
                error: null
            })
        };

        if (!!campaignDetail?.mktFindCampaign?.campaignVoucher?.collect_time) {
            setCollectTime({
                id: randomString(),
                value: new Date(campaignDetail?.mktFindCampaign?.campaignVoucher?.collect_time * 1000),
                error: null
            })
        };

        buildInitialValues({
            voucherDetail: campaignDetail?.mktFindCampaign
        })

    }, [paramsQuery?.action, campaignDetail]);

    const onCreateVoucher = async (values) => {
        try {
            const { data } = await createCampaign({
                variables: {
                    campaign_info: {
                        connector_channel_code: values?.channel,
                        discount_type: values?.typeVoucher == 3 ? +values?.typeVoucher : +values?.typeDiscount,
                        start_time: dayjs(timeVoucher?.values?.[0]).unix(),
                        end_time: dayjs(timeVoucher?.values?.[1]).unix(),
                        name: values?.name,
                        source: 1,
                        code: values?.code,
                        item_type: values?.typeItem,
                        store_id: +values?.store,
                        type: +paramsQuery?.typeCampaign
                    },
                    campaign_items: values?.typeItem == 1 ? productsVoucher?.flatMap(product => {
                        if (values?.channel != 'lazada') {
                            return {
                                sc_product_id: product?.id,
                                ref_product_id: product?.ref_id,
                                sc_variant_id: null,
                                sc_variant_sku: null,
                                ref_variant_id: null,
                                sme_variant_id: '',
                                sme_variant_sku: ''
                            }
                        }

                        return product?.productVariants
                            ?.filter(variant => values[`campaign-${product?.id}-${variant?.id}-active`])
                            ?.map(variant => ({
                                sc_product_id: product?.id,
                                sc_variant_id: variant?.id,
                                sc_variant_sku: variant?.sku,
                                ref_product_id: product?.ref_id,
                                ref_variant_id: variant?.ref_id,
                                sme_variant_id: '',
                                sme_variant_sku: ''
                            }))
                    }) : [],
                    voucher_info: {
                        collect_time: !!collectTime?.value ? dayjs(collectTime?.value).unix() : null,
                        discount_amount: values?.discount_amount,
                        usage_quantity: values?.usage_quantity,
                        limit_per_user: values?.limit_per_user,
                        max_discount_price: values?.max_discount_price,
                        min_order_price: values?.min_order_price
                    },
                    support_data: {
                        on_create_reserve_ticket: 0,
                        on_create_schedule_frame: 0,
                    }
                }
            });

            if (data?.mktSaveCampaign?.success) {
                addToast(formatMessage({ defaultMessage: 'Tạo mã giảm giá thành công' }), { appearance: 'success' })
                history.push(`/marketing/sale-list`);
            } else {
                addToast(data?.mktSaveCampaign?.message || formatMessage({ defaultMessage: 'Tạo mã giảm giá thất bại' }), { appearance: "error" })
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" })
        }
    }

    return (
        <Fragment>
            <Helmet
                titleTemplate={'UB - ' + paramsQuery?.typeCampaign ? TYPE_VOUCHER[paramsQuery?.typeCampaign] : ''}
                defaultTitle={'UB - ' + paramsQuery?.typeCampaign ? TYPE_VOUCHER[paramsQuery?.typeCampaign] : ''}
            >
                <meta
                    name="description"
                    content={'UB - ' + paramsQuery?.typeCampaign ? TYPE_VOUCHER[paramsQuery?.typeCampaign] : ''}
                />
            </Helmet>
            <LoadingDialog show={loadingCreateCampaign} />
            <Formik
                initialValues={initialValues}
                enableReinitialize
                validationSchema={validateSchema}
            >
                {({ values, touched, errors, setFieldValue, validateForm, setErrors, handleSubmit, setValues }) => {
                    const changed = values['__changed__'];

                    return (
                        <Form>
                            <RouterPrompt
                                when={changed}
                                title={formatMessage({ defaultMessage: 'Bạn đang tạo CTKM. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                                cancelText={formatMessage({ defaultMessage: 'Không' })}
                                okText={formatMessage({ defaultMessage: 'Có, Thoát' })}
                                onOK={() => true}
                                onCancel={() => false}
                            />
                            {showAddProduct && <ModalAddProducts
                                show={showAddProduct}
                                onHide={() => setShowAddProduct(false)}
                                productsCampaign={productsVoucher}
                                currentStore={+values?.store}
                                optionsStore={storeOptions?.map((store) => {
                                    return {
                                        value: store.value,
                                        label: store.label,
                                        logo: store.logo
                                    }
                                })}
                                onAddProductsCampaign={products => {
                                    let formValues = { ...values };
                                    const newProducts = products?.map(product => ({
                                        ...product,
                                        sync_error_message: null,
                                        sync_status: 1,
                                        productVariants: product?.productVariants?.filter(variant => !!variant?.ref_id)
                                    }))

                                    newProducts.forEach(product => {
                                        if (values?.channel == 'lazada') {
                                            (product?.productVariants || []).forEach(variant => {
                                                formValues[`campaign-${product?.id}-${variant?.id}-active`] = variant?.sellable_stock > 0 ? true : false;
                                            });
                                        }
                                    })

                                    setValues(formValues);
                                    setProductsVoucher(prev => prev.concat(newProducts));
                                }}
                            />}
                            <InfoVoucher
                                timeVoucher={timeVoucher}
                                collectTime={collectTime}
                                setCollectTime={setCollectTime}
                                setTimeVoucher={setTimeVoucher}
                            />

                            <ConfigVoucher />

                            <TableVoucher
                                setShowAddProduct={setShowAddProduct}
                            />

                            <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        history.push(`/marketing/sale-list`);
                                    }}
                                    className="btn btn mr-3"
                                    style={{ border: "1px solid #ff5629", color: "#ff5629" }}
                                >
                                    {formatMessage({ defaultMessage: 'HỦY BỎ' })}
                                </button>
                                <button
                                    className="btn btn-primary btn-elevate"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        setFieldValue('__changed__', false)
                                        const totalError = await validateForm();

                                        if (timeVoucher?.error || collectTime?.error || Object.keys(totalError)?.length > 0) {
                                            handleSubmit()
                                            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                            return;
                                        } else {
                                            const now = dayjs().startOf('minute').unix();
                                            const startTime = dayjs(timeVoucher?.values?.[0]).startOf('minute').unix();

                                            if (startTime <= now) {
                                                setTimeVoucher(prev => ({ ...prev, error: formatMessage({ defaultMessage: 'Thời gian bắt đầu phải lớn hơn thời gian hiện tại' }) }))
                                                return;
                                            }

                                            onCreateVoucher(values)
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'TẠO VOUCHER' })}
                                </button>
                            </div>
                        </Form>
                    )
                }}
            </Formik>
        </Fragment>
    )
}

const VoucherCreateWrapper = () => {
    return (
        <VoucherProvider>
            <VoucherCreate />
        </VoucherProvider>
    )
}

export default VoucherCreateWrapper