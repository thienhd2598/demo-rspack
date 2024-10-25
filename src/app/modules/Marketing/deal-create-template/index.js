import { useMutation, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import { Formik } from "formik";
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { useSubheader } from '../../../../_metronic/layout/_core/MetronicSubheader';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import mutate_mktSaveCampaignTemplate from '../../../../graphql/mutate_mktSaveCampaignTemplate';
import query_mktFindCampaignTemplate from '../../../../graphql/query_mktFindCampaignTemplate';
import { randomString } from '../../../../utils';
import LoadingDialog from '../../ProductsStore/products-list-draf/dialog/LoadingDialog';
import DealGifts from '../components/DealGifts';
import DealInfo from '../components/DealInfo';
import DealProducts from '../components/DealProducts';
import { TYPE_VOUCHER } from '../Constants';
import { DealProvider, useDealContext } from '../contexts/DealContext';
import ModalAddDealProducts from '../dialog/ModalAddDealProducts';

const DealCreateTemplate = () => {
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const { addToast } = useToasts();
    const { setBreadcrumbs } = useSubheader();
    const { initialValues, validateSchema, paramsQuery, storeOptions, productsDeal, setProductsDeal, giftsDeal, setGiftsDeal, buildInitialValues } = useDealContext();
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [listRangeTime, setListRangeTime] = useState([{
        id: randomString(),
        range: [new Date(dayjs().add(15, 'minute').toISOString()), new Date(dayjs().add(15, 'minute').add(1, "hour").toISOString())],
        collectTime: null,
        error: null,
        errorCollectTime: null
    }]);
    const [timeDeal, setTimeDeal] = useState({
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
            id: +paramsQuery?.id
        },
        fetchPolicy: 'cache-and-network',
        skip: !paramsQuery?.id
    })

    useEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Tạo chương trình khuyến mãi hàng loạt' }) },
            { title: paramsQuery?.typeCampaign ? TYPE_VOUCHER[paramsQuery?.typeCampaign] : '' },
        ]);
    }, [paramsQuery?.typeCampaign]);

    const [createCampaignTemplate, { loading: loadingCreateCampaignTemplate }] = useMutation(mutate_mktSaveCampaignTemplate, {
        awaitRefetchQueries: true,
        refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
    });

    useMemo(() => {
        if (paramsQuery?.action != 'copy' || !dataFindCampaignTemplate?.mktFindCampaignTemplate) return;

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
            dealDetail: dataFindCampaignTemplate?.mktFindCampaignTemplate,
            isTemplate: true
        })

    }, [paramsQuery?.action, dataFindCampaignTemplate?.mktFindCampaignTemplate]);

    const onCreateDealMutiple = async (values) => {
        try {
            const { data } = await createCampaignTemplate({
                variables: {
                    campaign_template_info: {
                        connector_channel_code: values?.channel,
                        list_range_time: listRangeTime?.map(item => ({
                            start_time: Math.round(item?.range?.[0]?.getTime() / 1000),
                            end_time: Math.round(item?.range?.[1]?.getTime() / 1000),
                        })),
                        name: values?.name,
                        store_id: +values?.store,
                        campaign_type: +paramsQuery?.typeCampaign
                    },
                    add_on_deal_info_basic: {
                        gift_num: values?.gift_num,
                        purchase_min_spend: values?.purchase_min_spend,
                    },
                    campaign_items: productsDeal?.map(product => ({
                        sc_product_id: product?.id,
                        ref_product_id: product?.ref_id,
                        is_enable: values[`campaign-${product?.id}-active`] ? 1 : 2,
                        sc_variant_id: null,
                        sc_variant_sku: null,
                        ref_variant_id: null,
                        sme_variant_id: '',
                        sme_variant_sku: ''
                    })),
                    campaign_sub_items: giftsDeal?.flatMap(product => {
                        return product?.productVariants?.map(variant => ({
                            sc_product_id: product?.id,
                            sc_variant_id: variant?.id,
                            sc_variant_sku: variant?.sku,
                            ref_product_id: product?.ref_id,
                            ref_variant_id: variant?.ref_id,
                            is_enable: values[`campaign-${product?.id}-${variant?.id}-active`] ? 1 : 2,
                            sme_variant_id: '',
                            sme_variant_sku: ''
                        }))
                    }),
                    support_data: {
                        on_create_reserve_ticket: 0,
                        on_create_schedule_frame: 0,
                    }
                }
            });

            if (data?.mktSaveCampaignTemplate?.success) {
                addToast(formatMessage({ defaultMessage: 'Tạo chương trình quà tặng hàng loạt thành công' }), { appearance: 'success' })
                history.push(`/marketing/sale-list?typeCampaign=template`);
            } else {
                addToast(data?.mktSaveCampaignTemplate?.message || formatMessage({ defaultMessage: 'Tạo chương trình quà tặng hàng loạt thất bại' }), { appearance: "error" })
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
            <LoadingDialog show={loadingCreateCampaignTemplate} />
            <Formik
                initialValues={initialValues}
                enableReinitialize
                validationSchema={validateSchema}
            >
                {({ values, touched, errors, setFieldValue, validateForm, setErrors, handleSubmit, setValues }) => {
                    const changed = values['__changed__'];

                    const totalVariantGiftActive = giftsDeal?.reduce((result, value) => {
                        (value?.productVariants || []).forEach(variant => {
                            if (!!values[`campaign-${value?.id}-${variant?.id}-active`]) {
                                result += 1;
                            }
                        })
                        return result
                    }, 0);
                    const totalProductsActive = productsDeal?.reduce((result, value) => {
                        if (!!values[`campaign-${value?.id}-active`]) {
                            result += 1;
                        }
                        return result
                    }, 0);
                    const disableOffActive = totalVariantGiftActive <= values?.gift_num

                    return (
                        <Fragment>
                            <RouterPrompt
                                when={changed}
                                title={formatMessage({ defaultMessage: 'Bạn đang tạo CTKM. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                                cancelText={formatMessage({ defaultMessage: 'Không' })}
                                okText={formatMessage({ defaultMessage: 'Có, Thoát' })}
                                onOK={() => true}
                                onCancel={() => false}
                            />
                            <Modal
                                show={showAlert}
                                aria-labelledby="example-modal-sizes-title-lg"
                                centered
                                onHide={() => { }}
                                backdrop={true}
                                dialogClassName={''}
                            >
                                <Modal.Body>
                                    <div>
                                        <span>{formatMessage({ defaultMessage: 'Ít nhất {count} quà tặng cần được kích hoạt trong chương trình này, nếu không người mua sẽ không thể chọn được số lượng quà tặng mong muốn' }, { count: values?.gift_num })}</span>
                                    </div>
                                    <div className=" d-flex justify-content-end mt-4">
                                        <button className="btn btn-primary" style={{ minWidth: 100 }} onClick={() => setShowAlert(false)}>
                                            {formatMessage({ defaultMessage: 'Đóng' })}
                                        </button>
                                    </div>
                                </Modal.Body>
                            </Modal>
                            {showAddProduct && <ModalAddDealProducts
                                show={!!showAddProduct}
                                onHide={() => setShowAddProduct(false)}
                                productsCampaign={showAddProduct == 'gift' ? giftsDeal : productsDeal}
                                currentStore={+values?.store}
                                filterOutIds={showAddProduct == 'gift'
                                    ? productsDeal?.map(product => product?.id)
                                    : giftsDeal?.map(product => product?.id)
                                }
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
                                    }));

                                    newProducts.forEach(product => {                                        
                                        formValues[`campaign-${product?.id}-active`] = product?.sum_sellable_stock > 0;

                                        if (showAddProduct == 'gift') {
                                            (product?.productVariants || []).forEach(variant => {
                                                formValues[`campaign-${product?.id}-${variant?.id}-active`] = variant?.sellable_stock > 0 ? true : false;
                                            });
                                        }
                                    })

                                    setValues(formValues);
                                    if (showAddProduct == 'gift') {
                                        setGiftsDeal(prev => prev.concat(newProducts));
                                    } else {
                                        setProductsDeal(prev => prev.concat(newProducts));
                                    }
                                }}
                            />}
                            <DealInfo
                                isTemplate
                                listRangeTime={listRangeTime}
                                setListRangeTime={setListRangeTime}
                                timeDeal={timeDeal}
                                collectTime={collectTime}
                                setCollectTime={setCollectTime}
                                setTimeDeal={setTimeDeal}
                            />

                            <DealProducts
                                isTemplate
                                setShowAddProduct={setShowAddProduct}
                            />

                            <DealGifts
                                isTemplate
                                totalVariantGiftActive={totalVariantGiftActive}
                                disableOffActive={disableOffActive}
                                setShowAlert={setShowAlert}
                                setShowAddProduct={setShowAddProduct}
                            />

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
                                    {formatMessage({ defaultMessage: 'HỦY BỎ' })}
                                </button>
                                <button
                                    className="btn btn-primary btn-elevate"
                                    type="submit"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        setFieldValue('__changed__', false)
                                        const totalError = await validateForm();

                                        if (listRangeTime?.some(time => !!time?.error) || Object.keys(totalError)?.length > 0) {
                                            handleSubmit()
                                            addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                            return;
                                        } else {
                                            if (productsDeal?.length == 0 && giftsDeal?.length > 0) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm chính tham gia chương trình' }), { appearance: 'error' })
                                                return;
                                            }

                                            if (totalProductsActive == 0 && productsDeal?.length > 0) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng bật ít nhất một sản phẩm chính' }), { appearance: 'error' })
                                                return;
                                            }

                                            if (giftsDeal?.length > 0 && totalVariantGiftActive < values?.gift_num) {
                                                setShowAlert(true);
                                                return;
                                            }

                                            onCreateDealMutiple(values)
                                        }
                                    }}
                                >
                                    {formatMessage({ defaultMessage: 'TẠO CHƯƠNG TRÌNH' })}
                                </button>
                            </div>
                        </Fragment>
                    )
                }}
            </Formik>
        </Fragment>
    )
}

const DealCreateTemplateWrapper = () => {
    return (
        <DealProvider isTemplate>
            <DealCreateTemplate />
        </DealProvider>
    )
}

export default DealCreateTemplateWrapper