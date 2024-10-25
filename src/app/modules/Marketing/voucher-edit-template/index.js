import { useMutation, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { Form, Formik } from "formik";
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { useSubheader } from '../../../../_metronic/layout/_core/MetronicSubheader';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import mutate_mktSaveCampaignTemplate from '../../../../graphql/mutate_mktSaveCampaignTemplate';
import query_mktFindCampaign from '../../../../graphql/query_mktFindCampaign';
import { randomString } from '../../../../utils';
import LoadingDialog from '../../ProductsStore/products-list-draf/dialog/LoadingDialog';
import { TYPE_VOUCHER } from '../Constants';
import { VoucherProvider, useVoucherContext } from '../contexts/VoucherContext';
import ConfigVoucher from '../components/ConfigVoucher';
import InfoVoucher from '../components/InfoVoucher';
import TableVoucher from '../components/TableVoucher';
import ModalAddProducts from '../dialog/ModalAddProducts';
import query_mktFindCampaignTemplate from '../../../../graphql/query_mktFindCampaignTemplate';
import mutate_mktApprovedTemplate from '../../../../graphql/mutate_mktApprovedTemplate';
import MutipleVoucher from '../components/MutipleVoucher';

const VoucherEditTemplate = () => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const params = useParams();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();
    const { initialValues, validateSchema, paramsQuery, storeOptions, productsVoucher, setProductsVoucher, buildInitialValues } = useVoucherContext();
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [listRangeTime, setListRangeTime] = useState([{
        id: randomString(),
        range: [new Date(dayjs().add(15, 'minute').toISOString()), new Date(dayjs().add(15, 'minute').add(1, "hour").toISOString())],
        collectTime: null,
        error: null,
        errorCollectTime: null
    }]);
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

    const { data: dataFindCampaignTemplate } = useQuery(query_mktFindCampaignTemplate, {
        variables: {
            id: +params?.id
        },
        fetchPolicy: 'cache-and-network'
    })

    useEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: '{name} chương trình khuyến mãi hàng loạt' }, { name: paramsQuery?.action == 'edit' ? 'Chỉnh sửa' : 'Chi tiết' }) },
            { title: dataFindCampaignTemplate?.mktFindCampaignTemplate ? TYPE_VOUCHER[dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaign_type] : '' },
        ]);
    }, [dataFindCampaignTemplate?.mktFindCampaignTemplate, paramsQuery?.action]);

    const [saveCampaignTemplate, { loading: loadingSaveCampaignTemplate }] = useMutation(mutate_mktSaveCampaignTemplate);

    const [approvedCampaignTemplate, { loading: loadingApprovedCampaignTemplate }] = useMutation(mutate_mktApprovedTemplate);

    useMemo(() => {
        if (!dataFindCampaignTemplate?.mktFindCampaignTemplate) return;

        if (!!dataFindCampaignTemplate?.mktFindCampaignTemplate?.list_range_time) {
            const listDate = dataFindCampaignTemplate?.mktFindCampaignTemplate?.list_range_time || {};

            setListRangeTime(listDate?.map(item => ({
                id: randomString(),
                range: [new Date(item?.start_time * 1000), new Date(item?.end_time * 1000)],
                collectTime: !!item?.collect_time ? new Date(item?.collect_time * 1000) : null,
                error: '',
                errorCollectTime: ''
            })))
        }

        buildInitialValues({
            voucherDetail: dataFindCampaignTemplate?.mktFindCampaignTemplate,
            isTemplate: true
        })

    }, [paramsQuery?.action, dataFindCampaignTemplate]);

    let channelDetail = useMemo(() => {
        if (!dataFindCampaignTemplate?.mktFindCampaignTemplate) return null;
        let { op_connector_channels, mktFindCampaignTemplate } = dataFindCampaignTemplate;
        let _store = op_connector_channels.find(
            (_st) => _st.code == mktFindCampaignTemplate?.connector_channel_code
        );

        return _store;
    }, [dataFindCampaignTemplate?.mktFindCampaignTemplate]);

    const onSaveVoucherTemplate = async (values, isApproved) => {
        try {
            const { data } = await saveCampaignTemplate({
                variables: {
                    campaign_template_info: {
                        connector_channel_code: values?.channel,
                        discount_type: values?.typeVoucher == 3 ? +values?.typeVoucher : +values?.typeDiscount,
                        discount_amount: values?.discount_amount,
                        list_range_time: listRangeTime?.map(item => ({
                            start_time: Math.round(item?.range?.[0]?.getTime() / 1000),
                            end_time: Math.round(item?.range?.[1]?.getTime() / 1000),
                            collect_time: !!item?.collectTime ? Math.round(item?.collectTime?.getTime() / 1000) : null
                        })),
                        name: values?.name,
                        // code: values?.code,
                        item_type: values?.typeItem,
                        store_id: +values?.store,
                        id: dataFindCampaignTemplate?.mktFindCampaignTemplate?.id,
                        campaign_type: dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaign_type
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
                        id: dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaignVoucher?.id,
                        collect_time: null,
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

            if (data?.mktSaveCampaignTemplate?.success) {
                if (isApproved) {
                    const { data: dataSync } = await approvedCampaignTemplate({
                        variables: {
                            id: +params.id
                        }
                    })
                    if (dataSync?.mktApprovedTemplate?.success) {
                        addToast(formatMessage({ defaultMessage: "Duyệt mã giảm giá hàng loạt thành công" }), { appearance: "success" })
                        history.push(`/marketing/sale-list?typeCampaign=template`)
                    } else {
                        addToast(dataSync?.mktApprovedTemplate?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra! Xin vui lòng thử lại' }), { appearance: "error" })
                        history.push(`/marketing/sale-list?typeCampaign=template`)
                    }
                } else {
                    addToast(formatMessage({ defaultMessage: 'Cập nhật mã giảm giá hàng loạt thành công' }), { appearance: 'success' })
                    history.push(`/marketing/sale-list?typeCampaign=template`);
                }
            } else {
                addToast(data?.mktSaveCampaignTemplate?.message || formatMessage({ defaultMessage: 'Cập nhật mã giảm giá hàng loạt thất bại' }), { appearance: "error" })
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
            <LoadingDialog show={loadingSaveCampaignTemplate || loadingApprovedCampaignTemplate} />
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
                                isTemplate
                                isEdit
                                isActionView={paramsQuery?.action != 'edit'}
                                channelDetail={channelDetail}
                                listRangeTime={listRangeTime}
                                setListRangeTime={setListRangeTime}
                                timeVoucher={timeVoucher}
                                collectTime={collectTime}
                                setCollectTime={setCollectTime}
                                setTimeVoucher={setTimeVoucher}
                            />

                            <ConfigVoucher
                                isActionView={paramsQuery?.action != 'edit'}                                
                            />

                            <TableVoucher
                                isActionView={paramsQuery?.action != 'edit'}
                                setShowAddProduct={setShowAddProduct}
                            />

                            {paramsQuery?.action != 'edit' && <MutipleVoucher
                                campaigns={dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaigns}
                            />}

                            <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        history.push(`/marketing/sale-list?typeCampaign=template`);
                                    }}
                                    className="btn btn mr-3"
                                    style={{ border: "1px solid #ff5629", color: "#ff5629" }}
                                >
                                    {paramsQuery?.action == 'edit' ? formatMessage({ defaultMessage: 'HỦY BỎ' }) : formatMessage({ defaultMessage: 'ĐÓNG' })}
                                </button>
                                {paramsQuery?.action == 'edit' && <Fragment>
                                    <button
                                        className="btn btn-primary btn-elevate mr-3"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            setFieldValue('__changed__', false)
                                            const totalError = await validateForm();
                                            delete totalError['code'];

                                            if (listRangeTime?.some(time => !!time?.error || !!time?.errorCollectTime) || Object.keys(totalError)?.length > 0) {
                                                handleSubmit()
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            } else {
                                                onSaveVoucherTemplate(values)
                                            }
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'CẬP NHẬT' })}
                                    </button>
                                    <button
                                        className="btn btn-primary btn-elevate"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            setFieldValue('__changed__', false)
                                            const totalError = await validateForm();
                                            delete totalError['code'];

                                            if (listRangeTime?.some(time => !!time?.error || !!time?.errorCollectTime) || Object.keys(totalError)?.length > 0) {
                                                handleSubmit()
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            } else {
                                                onSaveVoucherTemplate(values, true)
                                            }
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'DUYỆT' })}
                                    </button>
                                </Fragment>}
                            </div>
                        </Form>
                    )
                }}
            </Formik>
        </Fragment>
    )
}

const VoucherEditTemplateWrapper = () => {
    return (
        <VoucherProvider isTemplate>
            <VoucherEditTemplate />
        </VoucherProvider>
    )
}

export default VoucherEditTemplateWrapper