/* eslint-disable no-unused-expressions */
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
import mutate_scRemoveProductFrameImages from '../../../../graphql/mutate_scRemoveProductFrameImages';
import query_mktFindCampaign from '../../../../graphql/query_mktFindCampaign';
import query_sme_catalog_photo_frames_by_pk from '../../../../graphql/query_sme_catalog_photo_frames_by_pk';
import { OPTIONS_FRAME } from '../../FrameImage/FrameImageHelper';
import LoadingDialog from '../../ProductsStore/products-list-draf/dialog/LoadingDialog';
import ModalLoadFrameImage from '../../ProductsStore/products-list/dialog/ModalLoadFrameImage';
import { OPTIONS_TYPE_LIMIT, queryGetScProducts } from '../Constants';
import { MarketingProvider, useMarketingContext } from '../contexts/MarketingContext';
import DetailCampaignCreate from '../components/DetailCampaignCreate';
import InfoCampaignCreate from '../components/InfoCampaign';
import ModalAddProducts from '../dialog/ModalAddProducts';
import ModalConfirmAddFrame from '../dialog/ModalConfirmAddFrame';
import ModalImportCampaignItems from '../dialog/ModalImportCampaignItems';
import ModalProductCreateFrameImg from '../dialog/ModalProductCreateFrameImg';
import ModalResultImportFile from '../dialog/ModalResultImportFile';
import mutate_mktSaveCampaignTemplate from '../../../../graphql/mutate_mktSaveCampaignTemplate';
import InfoCampaignTemplate from '../campaign-template-create/InfoCampaignTemplate';
import DetailCampaignTemplate from '../campaign-template-create/DetailCampaignTemplate';
import query_mktFindCampaignTemplate from '../../../../graphql/query_mktFindCampaignTemplate';
import { randomString } from '../../../../utils';
import dayjs from 'dayjs';
import mutate_mktApprovedCampaign from '../../../../graphql/mutate_mktApprovedCampaign';
import mutate_mktApprovedTemplate from '../../../../graphql/mutate_mktApprovedTemplate';
import MutipleCampaignInfo from '../campaign-template-create/MutipleCampaignInfo';
import { minBy } from 'lodash';
import ModalImportCampaignDiscount from '../dialog/ModalImportCampaignDiscount';

const CampaignTemplateEdit = memo(({ }) => {
    const params = useParams();
    const { formatMessage } = useIntl();
    const location = useLocation();
    const history = useHistory();
    const paramsQuery = queryString.parse(location.search.slice(1, 100000));
    const { addToast } = useToasts();
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [productSelect, setProductSelect] = useState([]);
    const [syncImg, setSyncImg] = useState(null);
    const [idsFrameImg, setIdsFrameImg] = useState([]);
    const [isShowCreateFrameImg, setIsShowCreateFrameImg] = useState(false);
    const [showImportCampaignDiscount, setShowImportCampaignDiscount] = useState(false);
    const [productNotImgOrigin, setProductNotImgOrigin] = useState([]);
    const [showImportCampaignItems, setShowImportCampaignItems] = useState(false);
    const [showWarningPrompt, setShowWarningPrompt] = useState(false);
    const [showWarningItemType, setShowWarningItemType] = useState(false);
    const [dataResultImport, setDataResultImport] = useState(null);
    const { setBreadcrumbs } = useSubheader();
    const { initialValues, validateSchema, queryVariables, storeOptions, buildStateFromCampaignItems, campaignItems, setCampaignItems, addCampaignItemsManual } = useMarketingContext();
    const { page, limit } = queryVariables;
    const action = paramsQuery?.action;

    const [listRangeTime, setListRangeTime] = useState([{
        id: randomString(),
        range: [new Date(dayjs().add(15, 'minute').toISOString()), new Date(dayjs().add(15, 'minute').add(1, "hour").toISOString())],
        error: null
    }]);

    const [mktSaveCampaignTemplate, { loading: loadingMktSaveCampaignTemplate }] = useMutation(mutate_mktSaveCampaignTemplate, {});

    const [approvedCampaignTemplate, { loading: loadingApprovedCampaignTemplate }] = useMutation(mutate_mktApprovedTemplate);

    const [scRemoveProductFrameImg, { loading: loadingRemoveFrameImage }] = useMutation(mutate_scRemoveProductFrameImages, {
        awaitRefetchQueries: true,
        onCompleted: (data) => {
            setProductSelect([])
        }
    });

    const { data: dataFindCampaignTemplate } = useQuery(query_mktFindCampaignTemplate, {
        variables: {
            id: +params?.id
        },
        fetchPolicy: 'cache-and-network'
    })

    useEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: "{name} chương trình khuyến mãi hàng loạt" }, { name: action == 'edit' ? 'Cập nhật' : "Chi tiết" }) },
            { title: dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaign_type == 1 ? 'Chiết khấu sản phẩm' : 'FlashSale' },
        ]);
    }, [dataFindCampaignTemplate?.mktFindCampaignTemplate, action]);


    console.log({ dataFindCampaignTemplate });

    useMemo(() => {
        if (!!dataFindCampaignTemplate?.mktFindCampaignTemplate?.list_range_time) {
            const listDate = dataFindCampaignTemplate?.mktFindCampaignTemplate?.list_range_time || {};

            setListRangeTime(listDate?.map(item => ({
                id: randomString(),
                range: [new Date(item?.start_time * 1000), new Date(item?.end_time * 1000)],
                error: ''
            })))
        }

        buildStateFromCampaignItems({
            type: dataFindCampaignTemplate?.mktFindCampaignTemplate?.item_type == 1 ? 'product' : 'variant',
            from: 'template',
            infoCampaign: {
                ...dataFindCampaignTemplate?.mktFindCampaignTemplate,
                campaignItem: dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaignItems
            }
        })
    }, [dataFindCampaignTemplate])

    let channelDetail = useMemo(() => {
        if (!dataFindCampaignTemplate?.mktFindCampaignTemplate) return null;
        let { op_connector_channels, mktFindCampaignTemplate } = dataFindCampaignTemplate;
        let _store = op_connector_channels.find(
            (_st) => _st.code == mktFindCampaignTemplate?.connector_channel_code
        );

        return _store;
    }, [dataFindCampaignTemplate?.mktFindCampaignTemplate]);

    const isSelectedAll = useMemo(() => {
        if (campaignItems?.slice((page - 1) * limit, page * limit)?.length == 0) return false;

        return campaignItems?.slice((page - 1) * limit, page * limit)?.every(product => productSelect?.some(item => item?.id == product?.id));
    }, [productSelect, campaignItems]);

    const handleSelectAll = useCallback(
        (e) => {
            if (isSelectedAll) {
                setProductSelect(prev => prev.filter(item => !campaignItems?.slice((page - 1) * limit, page * limit).some(variant => variant?.id == item?.id)))
            } else {
                const data_filtered = campaignItems?.slice((page - 1) * limit, page * limit)?.filter(
                    _product => !productSelect?.some(__ => __?.id == _product?.id)
                )
                setProductSelect(prev => [...prev, ...data_filtered]);
            }
        }, [productSelect, campaignItems, isSelectedAll]
    );


    const removeFrameImgBatch = async () => {
        let res = await scRemoveProductFrameImg({ variables: { products: productSelect?.map(item => item?.id) } });

        if (!!res?.data?.scRemoveProductFrameImages?.success) {
            addToast(res?.data?.scRemoveProductFrameImages?.message || formatMessage({ defaultMessage: 'Xoá khung ảnh hàng loạt thành công' }), { appearance: 'success' });
        } else {
            addToast(res?.data?.scRemoveProductFrameImages?.message || formatMessage({ defaultMessage: 'Xoá khung ảnh hàng loạt thất bại' }), { appearance: 'error' });
        }
    }

    const createFrameImgBatch = () => {

        let productNotImgOrigin = productSelect.filter(item => !item?.productAssets.some(_asset => _asset.type === 4));
        setIdsFrameImg(productSelect?.map(item => item?.id));
        if (productNotImgOrigin?.length > 0) {
            setProductNotImgOrigin(productNotImgOrigin?.map(item => item?.name));
            return;
        }

        setIsShowCreateFrameImg(true);
    }

    const onSaveCampaignTemplate = async (values, isApproved) => {
        const { data } = await mktSaveCampaignTemplate({
            variables: {
                campaign_template_info: {
                    connector_channel_code: values?.channel,
                    discount_type: +values?.typeDiscount,
                    name: values?.name,
                    id: dataFindCampaignTemplate?.mktFindCampaignTemplate?.id,
                    item_type: values?.typeItem,
                    list_range_time: listRangeTime?.map(item => ({
                        start_time: Math.round(item?.range?.[0]?.getTime() / 1000),
                        end_time: Math.round(item?.range?.[1]?.getTime() / 1000),
                    })),
                    store_id: +values?.store,
                    campaign_type: dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaign_type
                },
                campaign_items: campaignItems.flatMap((product) => {
                    if (values?.typeItem == 1) {
                        return {
                            discount_percent: Math.ceil(+values[`campaign-${product?.id}-discount-percent`]),
                            promotion_price: Math.ceil(+values[`campaign-${product?.id}-promotion_price`]),
                            promotion_stock: values[`campaign-${product?.id}-purchase_limit`].value == 2 ? +values[`campaign-${product?.id}-purchase_limit_number`] : null,
                            purchase_limit: values[`campaign-${product?.id}-quantity_per_user`].value == 2 ? +values[`campaign-${product?.id}-quantity_per_user_number`] : null,
                            sc_product_id: product?.id,
                            ref_product_id: product?.ref_id,
                            sc_variant_id: null,
                            sc_variant_sku: null,
                            ref_variant_id: null,
                            sme_variant_id: '',
                            sme_variant_sku: ''
                        }
                    }

                    if (values?.typeItem == 2) {
                        return product?.productVariants
                            ?.filter(variant => values[`campaign-${product?.id}-${variant?.id}-active`])
                            ?.map(variant => ({
                                discount_percent: Math.ceil(+values[`campaign-${product?.id}-${variant?.id}-discount-percent`]),
                                promotion_price: Math.ceil(+values[`campaign-${product?.id}-${variant?.id}-promotion_price`]),
                                promotion_stock: values[`campaign-${product?.id}-${variant?.id}-purchase_limit`].value == 2 ? +values[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`] : null,
                                purchase_limit: values[`campaign-${product?.id}-${variant?.id}-quantity_per_user`].value == 2 ? +values[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`] : null,
                                sc_product_id: product?.id,
                                sc_variant_id: variant?.id,
                                sc_variant_sku: variant?.sku,
                                ref_product_id: product?.ref_id,
                                ref_variant_id: variant?.ref_id,
                                sme_variant_id: '',
                                sme_variant_sku: ''
                            }))
                    }
                }),
                support_data: {
                    on_create_reserve_ticket: 0,
                    on_create_schedule_frame: 0,
                }
            }

        })
        if (data?.mktSaveCampaignTemplate?.success) {
            if (isApproved) {
                const { data: dataSync } = await approvedCampaignTemplate({
                    variables: {
                        id: +params.id
                    }
                })
                if (dataSync?.mktApprovedTemplate?.success) {
                    addToast(formatMessage({ defaultMessage: "Duyệt chương trình khuyến mại hàng loạt thành công" }), { appearance: "success" })
                    history.push(`/marketing/sale-list?typeCampaign=template`)
                } else {
                    addToast(dataSync?.mktApprovedTemplate?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra! Xin vui lòng thử lại' }), { appearance: "error" })
                    history.push(`/marketing/sale-list?typeCampaign=template`)
                }
            } else {
                addToast(formatMessage({ defaultMessage: 'Cập nhật chương trình khuyến mại hàng loạt thành công' }), { appearance: 'success' })
                history.push(`/marketing/sale-list?typeCampaign=template`)
            }

        } else {
            addToast(data?.mktSaveCampaignTemplate?.message || formatMessage({ defaultMessage: 'Cập nhật chương trình khuyến mại hàng loạt thất bại' }), { appearance: "error" })
        }
    }

    return (
        <Fragment>
            <Helmet
                titleTemplate={'UB - ' + `${dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaign_type == 1 ? 'Chiết khấu sản phẩm' : 'FlashSale'}`}
                defaultTitle={'UB - ' + `${dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaign_type == 1 ? 'Chiết khấu sản phẩm' : 'FlashSale'}`}
            >
                <meta
                    name="description"
                    content={'UB - ' + `${dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaign_type == 1 ? 'Chiết khấu sản phẩm' : 'FlashSale'}`}
                />
            </Helmet>
            <ModalProductCreateFrameImg
                setProductSelect={setProductSelect}
                show={isShowCreateFrameImg}
                ids={idsFrameImg}
                onHide={() => setIsShowCreateFrameImg(false)}
                setSyncImg={setSyncImg}
            />
            {!!syncImg && <ModalLoadFrameImage
                syncImg={syncImg}
                onHide={() => setSyncImg(null)}
            />}
            <LoadingDialog show={loadingRemoveFrameImage || loadingMktSaveCampaignTemplate || loadingApprovedCampaignTemplate} />
            <ModalConfirmAddFrame
                setIsShowCreateFrameImg={setIsShowCreateFrameImg}
                productNotImgOrigin={productNotImgOrigin}
                setProductNotImgOrigin={setProductNotImgOrigin}
            />
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
                            <ModalImportCampaignItems
                                storeId={+values?.store}
                                type={values?.typeItem == 2 ? 'variant' : 'product'}
                                show={showImportCampaignItems}
                                onHide={() => setShowImportCampaignItems(false)}
                                setDataResultImport={async (result) => {
                                    let formValues = { ...values };

                                    const productIds = [...new Set(result?.list_pass?.map(item => item?.sc_product_id))];
                                    const scProducts = await queryGetScProducts(productIds);

                                    (result?.list_pass || []).forEach(item => {
                                        const scProduct = scProducts?.find(prod => prod?.id == item?.sc_product_id);
                                        const scProductPrice = minBy(scProduct?.productVariants, 'price')?.price;

                                        if (values?.typeItem == 1) {
                                            formValues[`campaign-${item?.sc_product_id}-discount-value`] = item?.promotional_price ? (scProductPrice - item?.promotional_price) : ''
                                            formValues[`campaign-${item?.sc_product_id}-discount-percent`] = item?.promotional_price ? Math.ceil(((scProductPrice - item?.promotional_price) / scProductPrice) * 100) : ''
                                            formValues[`campaign-${item?.sc_product_id}-promotion_price`] = item?.promotional_price || ''
                                            formValues[`campaign-${item?.sc_product_id}-quantity_per_user`] = item?.purchase_limit ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${item?.sc_product_id}-quantity_per_user_number`] = item?.purchase_limit || 1
                                            formValues[`campaign-${item?.sc_product_id}-purchase_limit`] = item?.promotion_stock ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${item?.sc_product_id}-purchase_limit_number`] = item?.promotion_stock || 1
                                        } else {
                                            const scProductVariant = scProduct?.productVariants?.find(variant => variant?.id == item?.sc_variant_id);
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-active`] = true
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-discount-value`] = item?.promotional_price ? (scProductVariant?.price - item?.promotional_price) : ''
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-discount-percent`] = item?.promotional_price ? Math.ceil(((scProductVariant?.price - item?.promotional_price) / scProductVariant?.price) * 100) : ''
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-promotion_price`] = item?.promotional_price || ''
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-quantity_per_user`] = item?.purchase_limit ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-quantity_per_user_number`] = item?.purchase_limit || 1
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-purchase_limit`] = item?.promotion_stock ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-purchase_limit_number`] = item?.promotion_stock || 1
                                        }
                                    })
                                    console.log({ result, formValues });
                                    setValues(formValues)
                                    setDataResultImport(result)
                                }}
                            />
                            {showImportCampaignDiscount && <ModalImportCampaignDiscount
                                storeId={+values?.store}
                                type={values?.typeItem == 2 ? 'variant' : 'product'}
                                show={showImportCampaignDiscount}
                                onHide={() => setShowImportCampaignDiscount(false)}
                                setDataResultImport={async (result) => {
                                    let formValues = { ...values };

                                    const productIds = [...new Set(result?.list_pass?.map(item => item?.sc_product_id))];
                                    const scProducts = await queryGetScProducts(productIds);

                                    console.log({ scProducts });

                                    (result?.list_pass || []).forEach(item => {
                                        const scProduct = scProducts?.find(prod => prod?.id == item?.sc_product_id);
                                        const scProductPrice = minBy(scProduct?.productVariants, 'price')?.price;

                                        if (values?.typeItem == 1) {
                                            formValues[`campaign-${item?.sc_product_id}-discount-value`] = item?.promotional_price ? (scProductPrice - item?.promotional_price) : ''
                                            formValues[`campaign-${item?.sc_product_id}-discount-percent`] = item?.promotional_price ? Math.ceil(((scProductPrice - item?.promotional_price) / scProductPrice) * 100) : ''
                                            formValues[`campaign-${item?.sc_product_id}-promotion_price`] = item?.promotional_price || ''
                                            formValues[`campaign-${item?.sc_product_id}-quantity_per_user`] = item?.purchase_limit ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${item?.sc_product_id}-quantity_per_user_number`] = item?.purchase_limit || 1
                                            formValues[`campaign-${item?.sc_product_id}-purchase_limit`] = item?.promotion_stock ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${item?.sc_product_id}-purchase_limit_number`] = item?.promotion_stock || 1
                                        } else {
                                            const scProductVariant = scProduct?.productVariants?.find(variant => variant?.id == item?.sc_variant_id);
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-active`] = true
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-discount-value`] = item?.promotional_price ? (scProductVariant?.price - item?.promotional_price) : ''
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-discount-percent`] = item?.promotional_price ? Math.ceil(((scProductVariant?.price - item?.promotional_price) / scProductVariant?.price) * 100) : ''
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-promotion_price`] = item?.promotional_price || ''
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-quantity_per_user`] = item?.purchase_limit ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-quantity_per_user_number`] = item?.purchase_limit || 1
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-purchase_limit`] = item?.promotion_stock ? OPTIONS_TYPE_LIMIT[1] : OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${item?.sc_product_id}-${item?.sc_variant_id}-purchase_limit_number`] = item?.promotion_stock || 1
                                        }
                                    })
                                    console.log({ result, formValues });
                                    setValues(formValues)
                                    setDataResultImport(result)
                                }}
                            />}
                            <ModalResultImportFile
                                result={dataResultImport}
                                onHide={() => {
                                    const infoCampaignItems = dataResultImport?.list_pass?.map(item => {
                                        return {
                                            sc_product_id: item?.sc_product_id,
                                            sc_variant_id: item?.sc_variant_id,
                                            list_sc_variant_id: item?.list_sc_variant_id?.filter(_item => _item != item?.sc_variant_id)
                                        }
                                    })?.filter(item => {
                                        if (values?.typeItem == 1) {
                                            return !campaignItems?.some(ci => ci?.id == item?.sc_product_id)
                                        } else {
                                            return !campaignItems?.some(ci => ci?.productVariants?.some(variant => variant?.id == item?.sc_variant_id))
                                        }
                                    })

                                    addCampaignItemsManual({
                                        type: values?.typeItem == 1 ? 'product' : 'variant',
                                        from: 'template',
                                        infoCampaignItems,
                                    })
                                    setDataResultImport(null);
                                }}
                            />
                            {showAddProduct && <ModalAddProducts
                                show={showAddProduct}
                                onHide={() => setShowAddProduct(false)}
                                productsCampaign={campaignItems}
                                onAddProductsCampaign={products => {
                                    const infoCampaignItems = values?.typeItem == 2
                                        ? products?.flatMap(product => product?.productVariants?.map(variant => ({ sc_variant_id: variant?.id })))
                                        : products?.map(product => ({ sc_product_id: product?.id }))

                                    // Add value formilk
                                    const formValues = { ...values };
                                    products.forEach(product => {
                                        if (values?.typeItem == 1) {
                                            formValues[`campaign-${product?.id}-discount-value`] = ''
                                            formValues[`campaign-${product?.id}-discount-percent`] = ''
                                            formValues[`campaign-${product?.id}-promotion_price`] = ''
                                            formValues[`campaign-${product?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${product?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[0]
                                            formValues[`campaign-${product?.id}-purchase_limit_number`] = 1
                                            formValues[`campaign-${product?.id}-quantity_per_user_number`] = 1
                                        }

                                        if (values?.typeItem == 2) {
                                            (product?.productVariants || []).forEach(variant => {
                                                formValues[`campaign-${product?.id}-${variant?.id}-active`] = variant?.sellable_stock > 0 ? true : false;
                                                formValues[`campaign-${product?.id}-${variant?.id}-discount-value`] = ''
                                                formValues[`campaign-${product?.id}-${variant?.id}-discount-percent`] = ''
                                                formValues[`campaign-${product?.id}-${variant?.id}-promotion_price`] = ''
                                                formValues[`campaign-${product?.id}-${variant?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[0]
                                                formValues[`campaign-${product?.id}-${variant?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[0]
                                                formValues[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`] = 1
                                                formValues[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`] = 1
                                            })
                                        }
                                    });
                                    setValues(formValues);

                                    // Build campaign items
                                    addCampaignItemsManual({
                                        type: values?.typeItem == 2 ? 'variant' : 'product',
                                        from: 'modal',
                                        infoCampaignItems: infoCampaignItems
                                    });
                                }}
                                currentStore={+values?.store}
                                optionsStore={storeOptions?.map((store) => {
                                    return {
                                        value: store.value,
                                        label: store.label,
                                        logo: store.logo
                                    }
                                })}
                            />}
                            <Modal
                                show={showWarningPrompt}
                                aria-labelledby="example-modal-sizes-title-lg"
                                centered
                                backdrop={'static'}
                            >
                                <Modal.Body className="overlay overlay-block cursor-default text-center">
                                    <div className="mb-4" >Việc thay đổi loại giảm giá sẽ làm xoá thông tin về giá của các hàng hoá đã chọn bên dưới. Bạn vẫn muốn tiếp tục?</div>

                                    <div className="form-group mb-0">
                                        <button
                                            type="button"
                                            className="btn btn-light btn-elevate mr-3"
                                            style={{ minWidth: 100 }}
                                            onClick={() => {
                                                setShowWarningPrompt(false)
                                            }}
                                        >
                                            <span className="font-weight-boldest">Đóng</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-primary font-weight-bold`}
                                            style={{ minWidth: 100 }}
                                            onClick={() => {
                                                const formValues = { ...values };
                                                if (values[`typeDiscount`] == 1) {
                                                    formValues['typeDiscount'] = 2
                                                } else {
                                                    formValues['typeDiscount'] = 1
                                                }
                                                campaignItems?.forEach(product => {
                                                    if (values?.typeItem == 1) {
                                                        formValues[`campaign-${product?.id}-quantity_per_user_number`] = ''
                                                        formValues[`campaign-${product?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[0]
                                                        formValues[`campaign-${product?.id}-purchase_limit_number`] = ''
                                                        formValues[`campaign-${product?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[0]
                                                        formValues[`campaign-${product?.id}-discount-percent`] = ''
                                                        formValues[`campaign-${product.id}-promotion_price`] = ''
                                                        formValues[`campaign-${product?.id}-discount-value`] = ''
                                                    }

                                                    if (values?.typeItem == 2) {
                                                        (product?.productVariants || []).forEach(variant => {
                                                            formValues[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`] = ''
                                                            formValues[`campaign-${product?.id}-${variant?.id}-quantity_per_user`] = OPTIONS_TYPE_LIMIT[0]
                                                            formValues[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`] = ''
                                                            formValues[`campaign-${product?.id}-${variant?.id}-purchase_limit`] = OPTIONS_TYPE_LIMIT[0]
                                                            formValues[`campaign-${product?.id}-${variant?.id}-discount-percent`] = ''
                                                            formValues[`campaign-${product.id}-${variant?.id}-promotion_price`] = ''
                                                            formValues[`campaign-${product?.id}-${variant?.id}-discount-value`] = ''
                                                        })
                                                    }

                                                })
                                                setValues(formValues);
                                                setShowWarningPrompt(false)
                                            }}
                                        >
                                            <span className="font-weight-boldest">Xác nhận</span>
                                        </button>
                                    </div>
                                </Modal.Body>
                            </Modal >

                            <Modal
                                show={showWarningItemType}
                                aria-labelledby="example-modal-sizes-title-lg"
                                centered
                                backdrop={'static'}
                            >
                                <Modal.Body className="overlay overlay-block cursor-default text-center">
                                    <div className="mb-4" >Việc thay đổi loại sản phẩm hoặc hàng hóa sẽ làm xoá thông tin đã chọn bên dưới. Bạn vẫn muốn tiếp tục?</div>

                                    <div className="form-group mb-0">
                                        <button
                                            type="button"
                                            className="btn btn-light btn-elevate mr-3"
                                            style={{ minWidth: 100 }}
                                            onClick={() => setShowWarningItemType(false)}
                                        >
                                            <span className="font-weight-boldest">Đóng</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-primary font-weight-bold`}
                                            style={{ minWidth: 100 }}
                                            onClick={() => {
                                                if (values[`typeItem`] == 1) {
                                                    setFieldValue('typeItem', 2)
                                                } else {
                                                    setFieldValue('typeItem', 1)
                                                }

                                                setCampaignItems([]);
                                                setShowWarningItemType(false);
                                            }}
                                        >
                                            <span className="font-weight-boldest">Xác nhận</span>
                                        </button>
                                    </div>
                                </Modal.Body>
                            </Modal >

                            <InfoCampaignTemplate
                                isEdit
                                isActionView={action != 'edit'}
                                channelDetail={channelDetail}
                                setShowWarningPrompt={setShowWarningPrompt}
                                setListRangeTime={setListRangeTime}
                                listRangeTime={listRangeTime}
                            />

                            <DetailCampaignTemplate
                                isEdit
                                isActionView={action != 'edit'}
                                productSelect={productSelect}
                                setProductSelect={setProductSelect}
                                isSelectedAll={isSelectedAll}
                                handleSelectAll={handleSelectAll}
                                setShowWarningItemType={setShowWarningItemType}
                                setShowImportCampaignItems={setShowImportCampaignItems}
                                setShowImportCampaignDiscount={setShowImportCampaignDiscount}
                                setShowAddProduct={setShowAddProduct}
                                createFrameImgBatch={createFrameImgBatch}
                                removeFrameImgBatch={removeFrameImgBatch}
                            />

                            {action != 'edit' && (
                                <MutipleCampaignInfo
                                    campaigns={dataFindCampaignTemplate?.mktFindCampaignTemplate?.campaigns}
                                />
                            )}
                            <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        history.push(
                                            `/marketing/sale-list?typeCampaign=template`
                                        );
                                    }}
                                    className="btn btn mr-4"
                                    style={{ border: "1px solid #ff5629", color: "#ff5629" }}
                                >
                                    {action != 'edit' ? formatMessage({ defaultMessage: 'Đóng' }) : formatMessage({ defaultMessage: 'Hủy bỏ' })}
                                </button>
                                {action == 'edit' && <>
                                    <button
                                        className="btn btn-primary btn-elevate"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            setFieldValue('__changed__', false)
                                            const totalError = await validateForm()
                                            if (listRangeTime?.some(time => !!time?.error)) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            }

                                            (campaignItems || []).forEach(product => {
                                                if (values?.typeDiscount == 1) {
                                                    delete totalError[`campaign-${product?.id}-discount-percent`];
                                                } else {
                                                    delete totalError[`campaign-${product?.id}-discount-value`];
                                                }
                                                if (values[`campaign-${product?.id}-quantity_per_user`]?.value == 1) {
                                                    delete totalError[`campaign-${product?.id}-quantity_per_user_number`];
                                                }
                                                if (values[`campaign-${product?.id}-purchase_limit`]?.value == 1) {
                                                    delete totalError[`campaign-${product?.id}-purchase_limit_number`];
                                                }
                                                (product?.productVariants || []).forEach(variant => {
                                                    if (values?.typeDiscount == 1) {
                                                        delete totalError[`campaign-${product?.id}-${variant?.id}-discount-percent`];
                                                    } else {
                                                        delete totalError[`campaign-${product?.id}-${variant?.id}-discount-value`];
                                                    }
                                                    if (values[`campaign-${product?.id}-${variant?.id}-purchase_limit`]?.value == 1) {
                                                        delete totalError[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`]
                                                    }
                                                    if (values[`campaign-${product?.id}-${variant?.id}-quantity_per_user`]?.value == 1) {
                                                        delete totalError[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`]
                                                    }
                                                })
                                            });

                                            if (Object.keys(totalError)?.filter((item) => {
                                                return !['quantity_per_user_number', 'quantity_number', 'discount_percent', 'discount_value'].includes(item)
                                            })?.length > 0) {
                                                handleSubmit()
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            } else {
                                                onSaveCampaignTemplate(values)
                                            }
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Cập nhật' })}
                                    </button>
                                    <button
                                        className="btn btn-primary btn-elevate ml-4"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            setFieldValue('__changed__', false)
                                            const totalError = await validateForm()
                                            if (listRangeTime?.some(time => !!time?.error)) {
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            }

                                            (campaignItems || []).forEach(product => {
                                                if (values?.typeDiscount == 1) {
                                                    delete totalError[`campaign-${product?.id}-discount-percent`];
                                                } else {
                                                    delete totalError[`campaign-${product?.id}-discount-value`];
                                                }
                                                if (values[`campaign-${product?.id}-quantity_per_user`]?.value == 1) {
                                                    delete totalError[`campaign-${product?.id}-quantity_per_user_number`];
                                                }
                                                if (values[`campaign-${product?.id}-purchase_limit`]?.value == 1) {
                                                    delete totalError[`campaign-${product?.id}-purchase_limit_number`];
                                                }
                                                (product?.productVariants || []).forEach(variant => {
                                                    if (values?.typeDiscount == 1) {
                                                        delete totalError[`campaign-${product?.id}-${variant?.id}-discount-percent`];
                                                    } else {
                                                        delete totalError[`campaign-${product?.id}-${variant?.id}-discount-value`];
                                                    }
                                                    if (values[`campaign-${product?.id}-${variant?.id}-purchase_limit`]?.value == 1) {
                                                        delete totalError[`campaign-${product?.id}-${variant?.id}-purchase_limit_number`]
                                                    }
                                                    if (values[`campaign-${product?.id}-${variant?.id}-quantity_per_user`]?.value == 1) {
                                                        delete totalError[`campaign-${product?.id}-${variant?.id}-quantity_per_user_number`]
                                                    }
                                                })
                                            });

                                            if (Object.keys(totalError)?.filter((item) => {
                                                return !['quantity_per_user_number', 'quantity_number', 'discount_percent', 'discount_value'].includes(item)
                                            })?.length > 0) {
                                                handleSubmit()
                                                addToast(formatMessage({ defaultMessage: 'Vui lòng nhập đầy đủ các trường thông tin đã được khoanh đỏ' }), { appearance: 'error' })
                                                return;
                                            } else {
                                                onSaveCampaignTemplate(values, true)
                                            }
                                        }}
                                    >
                                        {formatMessage({ defaultMessage: 'Duyệt' })}
                                    </button>
                                </>}
                            </div>
                        </Form>)
                }}
            </Formik>
        </Fragment>
    );
});

const CamPaignEditTemplateWrapper = () => {
    return (
        <MarketingProvider>
            <CampaignTemplateEdit />
        </MarketingProvider>
    )
}

export default CamPaignEditTemplateWrapper;
