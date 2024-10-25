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
import mutate_mktApprovedCampaign from '../../../../graphql/mutate_mktApprovedCampaign';
import query_mktFindCampaign from '../../../../graphql/query_mktFindCampaign';

const VoucherEdit = () => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const params = useParams();
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
        variables: { id: Number(params.id) },
        fetchPolicy: 'cache-and-network',
    });

    const [updateCampaign, { loading: loadingUpdateCampaign }] = useMutation(mutate_mktSaveCampaign, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
    });

    const [approvedCampaign, { loading: loadingApprovedCampaign }] = useMutation(mutate_mktApprovedCampaign, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
    });

    useEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: '{name} chương trình khuyến mãi' }, { name: paramsQuery?.action == 'edit' ? 'Chỉnh sửa' : 'Chi tiết' }) },
            { title: campaignDetail?.mktFindCampaign?.type ? TYPE_VOUCHER[campaignDetail?.mktFindCampaign?.type] : '' },
        ]);
    }, [campaignDetail?.mktFindCampaign?.type, paramsQuery?.action]);

    const channelDetail = useMemo(() => {
        if (!campaignDetail) return null;
        let { op_connector_channels, mktFindCampaign } = campaignDetail;
        let _store = op_connector_channels.find(
            (_st) => _st.code == mktFindCampaign?.connector_channel_code
        );

        return _store;
    }, [campaignDetail]);

    useMemo(() => {
        if (!campaignDetail?.mktFindCampaign) return;

        if (!!campaignDetail?.mktFindCampaign?.start_time && !!campaignDetail?.mktFindCampaign?.end_time) {
            setTimeVoucher({
                id: randomString(),
                values: [new Date(campaignDetail?.mktFindCampaign?.start_time * 1000), new Date(campaignDetail?.mktFindCampaign?.end_time * 1000)],
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

    }, [campaignDetail?.mktFindCampaign]);

    const onUpdateVoucher = async (values, isApproved) => {
        try {
            const { data } = await updateCampaign({
                variables: {
                    campaign_info: {
                        id: campaignDetail?.mktFindCampaign?.id,
                        connector_channel_code: values?.channel,
                        discount_type: values?.typeVoucher == 3 ? +values?.typeVoucher : +values?.typeDiscount,
                        start_time: dayjs(timeVoucher?.values?.[0]).unix(),
                        end_time: dayjs(timeVoucher?.values?.[1]).unix(),
                        name: values?.name,
                        source: 1,
                        code: values?.code,
                        item_type: values?.typeItem,
                        store_id: +values?.store,
                        type: campaignDetail?.mktFindCampaign?.type
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
                        id: campaignDetail?.mktFindCampaign?.campaignVoucher?.id,
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
                if (isApproved) {
                    const { data: dataSync } = await approvedCampaign({
                        variables: {
                            list_campaign_id: [+params.id]
                        }
                    })
                    history.push(`/marketing/sale-list`);
                    if (dataSync?.mktApprovedCampaign?.success) {
                        addToast(formatMessage({ defaultMessage: "Duyệt mã giảm giá thành công" }), { appearance: "success" })
                    } else {
                        addToast(dataSync?.mktApprovedCampaign?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra! Xin vui lòng thử lại' }), { appearance: "error" })
                    }
                } else {
                    addToast(formatMessage({ defaultMessage: 'Cập nhật mã giảm giá thành công' }), { appearance: 'success' })
                    history.push(`/marketing/sale-list`);
                }
            } else {
                addToast(data?.mktSaveCampaign?.message || formatMessage({ defaultMessage: 'Cập nhật mã giảm giá thất bại' }), { appearance: "error" })
            }
        } catch (error) {
            addToast(formatMessage({ defaultMessage: 'Có lỗi xảy ra, xin vui lòng thử lại' }), { appearance: "error" })
        }
    }

    return (
        <Fragment>
            <Helmet
                titleTemplate={'UB - ' + campaignDetail?.mktFindCampaign?.type ? TYPE_VOUCHER[campaignDetail?.mktFindCampaign?.type] : ''}
                defaultTitle={'UB - ' + campaignDetail?.mktFindCampaign?.type ? TYPE_VOUCHER[campaignDetail?.mktFindCampaign?.type] : ''}
            >
                <meta
                    name="description"
                    content={'UB - ' + campaignDetail?.mktFindCampaign?.type ? TYPE_VOUCHER[campaignDetail?.mktFindCampaign?.type] : ''}
                />
            </Helmet>
            <LoadingDialog show={loadingUpdateCampaign || loadingApprovedCampaign} />
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
                                when={changed && paramsQuery?.action == 'edit'}
                                title={formatMessage({ defaultMessage: 'Bạn đang chỉnh sửa CTKM. Mọi thông tin bạn sửa trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
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
                                        productVariants: product?.productVariants
                                            ?.filter(variant => !!variant?.ref_id)
                                            ?.map(variant => ({
                                                ...variant,
                                                sync_error_message: null,
                                                sync_status: 1,
                                            }))
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
                                isEdit
                                voucherDetail={campaignDetail?.mktFindCampaign}
                                loading={loadingDetail}
                                channelDetail={channelDetail}
                                isActionView={paramsQuery?.action != 'edit'}
                                timeVoucher={timeVoucher}
                                collectTime={collectTime}
                                setCollectTime={setCollectTime}
                                setTimeVoucher={setTimeVoucher}
                            />

                            <ConfigVoucher
                                isEdit
                                loading={loadingDetail}
                                voucherDetail={campaignDetail?.mktFindCampaign}
                                isActionView={paramsQuery?.action != 'edit'}
                            />

                            <TableVoucher
                                isEdit
                                loading={loadingDetail}
                                voucherDetail={campaignDetail?.mktFindCampaign}
                                isActionView={paramsQuery?.action != 'edit'}
                                setShowAddProduct={setShowAddProduct}
                            />

                            {paramsQuery?.action != 'edit' && <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        history.push(`/marketing/sale-list`);
                                    }}
                                    className="btn btn mr-3"
                                    style={{ border: "1px solid #ff5629", color: "#ff5629" }}
                                >
                                    {formatMessage({ defaultMessage: 'ĐÓNG' })}
                                </button></div>}
                            {paramsQuery?.action == 'edit' && <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
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
                                    className="btn btn-primary btn-elevate mr-3"
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

                                            if (startTime <= now && values?.status == 1) {
                                                setTimeVoucher(prev => ({ ...prev, error: formatMessage({ defaultMessage: 'Thời gian bắt đầu phải lớn hơn thời gian hiện tại' }) }))
                                                return;
                                            }

                                            onUpdateVoucher(values)
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'CẬP NHẬT' })}
                                </button>
                                {values?.status == 1 && <button
                                    className="btn btn-primary btn-elevate mr-3"
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

                                            onUpdateVoucher(values, true);
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'DUYỆT' })}
                                </button>}
                            </div>}
                        </Form>
                    )
                }}
            </Formik>
        </Fragment>
    )
}

const VoucherEditWrapper = () => {
    return (
        <VoucherProvider>
            <VoucherEdit />
        </VoucherProvider>
    )
}

export default VoucherEditWrapper