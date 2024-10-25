/* eslint-disable no-unused-expressions */
import { useMutation, useQuery } from '@apollo/client';
import { Form, Formik } from "formik";
import queryString from 'querystring';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useToasts } from 'react-toast-notifications';
import { useSubheader } from '../../../../_metronic/layout/_core/MetronicSubheader';
import AuthorizationWrapper from '../../../../components/AuthorizationWrapper';
import { RouterPrompt } from '../../../../components/RouterPrompt';
import mutate_mktApprovedCampaign from '../../../../graphql/mutate_mktApprovedCampaign';
import mutate_mktSaveCampaign from '../../../../graphql/mutate_mktSaveCampaign';
import mutate_retryCampaignItem from '../../../../graphql/mutate_retryCampaignItem';
import mutate_scRemoveProductFrameImages from '../../../../graphql/mutate_scRemoveProductFrameImages';
import query_mktFindCampaign from '../../../../graphql/query_mktFindCampaign';
import query_sme_catalog_photo_frames_by_pk from '../../../../graphql/query_sme_catalog_photo_frames_by_pk';
import { OPTIONS_FRAME } from '../../FrameImage/FrameImageHelper';
import LoadingDialog from '../../ProductsStore/products-list-draf/dialog/LoadingDialog';
import ModalLoadFrameImage from '../../ProductsStore/products-list/dialog/ModalLoadFrameImage';
import { OPTIONS_TYPE_LIMIT, queryGetScProducts } from '../Constants';
import { MarketingProvider, useMarketingContext } from '../contexts/MarketingContext';
import DetailCampaignEdit from '../components/DetailCampaignEdit';
import InfoCampaign from '../components/InfoCampaign';
import ModalAddProducts from '../dialog/ModalAddProducts';
import ModalConfirmAddFrame from '../dialog/ModalConfirmAddFrame';
import ModalImportCampaignItems from '../dialog/ModalImportCampaignItems';
import ModalProductCreateFrameImg from '../dialog/ModalProductCreateFrameImg';
import ModalResultImportFile from '../dialog/ModalResultImportFile';
import { minBy } from 'lodash';
import ModalImportCampaignDiscount from '../dialog/ModalImportCampaignDiscount';

const CampaignDetail = ({ }) => {
  const params = useParams();
  const { formatMessage } = useIntl();
  const location = useLocation();
  const history = useHistory();
  const paramsQuery = queryString.parse(location.search.slice(1, 100000));
  const { addToast } = useToasts();
  const { setBreadcrumbs } = useSubheader();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productsScheduled, setProductsScheduled] = useState([]);
  const [syncImg, setSyncImg] = useState(null);
  const [isShowCreateFrameImg, setIsShowCreateFrameImg] = useState(false);
  const [productNotImgOrigin, setProductNotImgOrigin] = useState([]);
  const [showImportCampaignItems, setShowImportCampaignItems] = useState(false);
  const [showImportCampaignDiscount, setShowImportCampaignDiscount] = useState(false);
  const [idsFrameImg, setIdsFrameImg] = useState([]);
  const [productSelect, setProductSelect] = useState([]);
  const action = paramsQuery?.action;
  const [showWarningPrompt, setShowWarningPrompt] = useState(false)
  const [showWarningItemType, setShowWarningItemType] = useState(false);
  const { initialValues, validateSchema, queryVariables, storeOptions, buildStateFromCampaignItems, campaignItems, setCampaignItems, addCampaignItemsManual } = useMarketingContext();
  const [dataResultImport, setDataResultImport] = useState(null);
  const { page, limit } = queryVariables;

  const [retryCampaignItem] = useMutation(mutate_retryCampaignItem,
    {
      awaitRefetchQueries: true,
      refetchQueries: ['mktListCampaign', 'mktCampaignAggregate', 'mktFindCampaign']
    }
  )
  const [updateCampaign, { loading: loadingUpdateCampaign }] = useMutation(mutate_mktSaveCampaign);
  const { data: campaignDetail, loading: loadingDetail, refetch, error } = useQuery(query_mktFindCampaign, {
    variables: { id: Number(params.id) },
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    setBreadcrumbs([
      { title: `${action == 'edit' ? 'Chỉnh sửa' : "Chi tiết"} chương trình khuyến mãi` },
      { title: campaignDetail?.mktFindCampaign?.type == 1 ? 'Chiết khấu sản phẩm' : (campaignDetail?.mktFindCampaign?.type == 2 ? 'FlashSale' : 'Chương trình khác') },
    ]);
  }, [campaignDetail]);

  const saleStatus = useMemo(() => {
    const currentDate = new Date();
    if (campaignDetail?.mktFindCampaign?.status == 1) {
      return 'pending'
    }
    else if (
      !!(
        new Date(campaignDetail?.mktFindCampaign?.start_time * 1000) >= currentDate && campaignDetail?.mktFindCampaign?.status == 2
      )
    ) {
      return 'coming_soon';
    } else if (
      !!(
        new Date(campaignDetail?.mktFindCampaign?.start_time * 1000) < currentDate &&
        new Date(campaignDetail?.mktFindCampaign?.end_time * 1000) > currentDate && campaignDetail?.mktFindCampaign?.status == 2
      )
    ) {
      return 'happening';
    } else {
      return 'finished';
    }
  }, [campaignDetail]);

  const [approvedCampaign, { loading: loadingApprovedCampaign }] = useMutation(mutate_mktApprovedCampaign, {
    awaitRefetchQueries: true,
    refetchQueries: ['mktListCampaign', 'mktCampaignAggregate']
  });

  const { data: dataFrameByPk } = useQuery(query_sme_catalog_photo_frames_by_pk, {
    variables: { id: campaignDetail?.mktFindCampaign?.campaignScheduleFrame?.frame_id }
  });

  console.log({ dataFrameByPk })

  useMemo(() => {
    const frameInfo = {
      id: dataFrameByPk?.sme_catalog_photo_frames_by_pk?.id,
      url: dataFrameByPk?.sme_catalog_photo_frames_by_pk?.asset_url,
      name: dataFrameByPk?.sme_catalog_photo_frames_by_pk?.name
    };

    buildStateFromCampaignItems({
      type: campaignDetail?.mktFindCampaign?.item_type == 1 ? 'product' : 'variant',
      infoCampaign: {
        frameInfo,
        ...campaignDetail?.mktFindCampaign
      }
    })
  }, [campaignDetail, dataFrameByPk])

  let channelDetail = useMemo(() => {
    if (!campaignDetail) return null;
    let { op_connector_channels, mktFindCampaign } = campaignDetail;
    let _store = op_connector_channels.find(
      (_st) => _st.code == mktFindCampaign?.connector_channel_code
    );

    return _store;
  }, [campaignDetail]);

  const [scRemoveProductFrameImg, { loading: loadingRemoveFrameImage }] = useMutation(mutate_scRemoveProductFrameImages, {
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      setProductSelect([])
    }
  });

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

  const onSaveCampaign = async (values, isApproved) => {
    const variables = {
      is_sync: campaignDetail?.mktFindCampaign?.status == 2 ? 1 : null,
      campaign_info: {
        id: +params?.id,
        connector_channel_code: values?.channel,
        discount_type: +values?.typeDiscount,
        end_time: Math.round(values?.timeValue[1]?.getTime() / 1000),
        name: values?.name,
        source: 1,
        item_type: values?.typeItem,
        start_time: Math.round(values?.timeValue[0]?.getTime() / 1000),
        store_id: +values?.store,
        type: values?.type == 'discount' ? 1 : 2
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
        on_create_reserve_ticket: !!values['on_create_reserve_ticket'] ? 1 : 0,
        on_create_schedule_frame: !!values['on_create_schedule_frame'] ? 1 : 0,
        ...(values['on_create_schedule_frame'] ? {
          schedule_frame_info: {
            apply_before_second: (values['day']?.value || 0) * 86400 + (values['hour']?.value || 0) * 3600 + (values['minute']?.value || 0) * 60 + (values['second']?.value || 0),
            apply_type: values['apply_type']?.value,
            frame_id: values['frame']?.id,
            option: String(OPTIONS_FRAME?.find(op => op?.value == values['option']?.value)?.value)
          }
        } : {})
      }
    }

    console.log({ variables })

    const { data: dataUpdate } = await updateCampaign({ variables });

    if (dataUpdate?.mktSaveCampaign?.success) {
      if (isApproved) {
        const { data: dataSync } = await approvedCampaign({
          variables: {
            list_campaign_id: [+location?.state?.id || +params.id]
          }
        })
        if (dataSync?.mktApprovedCampaign?.success) {
          addToast(formatMessage({ defaultMessage: "Duyệt chương trình khuyến mại thành công" }), { appearance: "success" })
          history.push(`/marketing/sale-list`);
        } else {
          addToast(dataSync?.mktApprovedCampaign?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra! Xin vui lòng thử lại' }), { appearance: "error" })
          history.push(`/marketing/sale-list`);
        }
      } else {
        if (dataUpdate?.mktSaveCampaign?.success) {
          addToast(formatMessage({ defaultMessage: 'Chỉnh sửa chương trình khuyến mại thành công' }), { appearance: 'success' })
          history.push(`/marketing/sale-list`)
        } else {
          addToast(dataUpdate?.mktSaveCampaign?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra! Xin vui lòng thử lại' }), { appearance: "error" })
          history.push(`/marketing/sale-list`)
        }
      }
    } else {
      addToast(dataUpdate?.mktSaveCampaign?.message || formatMessage({ defaultMessage: 'Có lỗi xảy ra! Xin vui lòng thử lại' }), { appearance: "error" })
      history.push(`/marketing/sale-list`)
    }
  }


  return (
    <Fragment>
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
      <LoadingDialog show={loadingRemoveFrameImage || loadingApprovedCampaign || loadingUpdateCampaign} />
      <ModalConfirmAddFrame setIsShowCreateFrameImg={setIsShowCreateFrameImg} productNotImgOrigin={productNotImgOrigin} setProductNotImgOrigin={setProductNotImgOrigin} />
      <Helmet
        titleTemplate={
          'UB - ' + `${campaignDetail?.mktFindCampaign?.type == 1
            ? 'Chiết khấu sản phẩm'
            : (campaignDetail?.mktFindCampaign?.type == 2
              ? 'FlashSale'
              : 'Chương trình khác')}`
        }
        defaultTitle={
          'UB - ' + `${campaignDetail?.mktFindCampaign?.type == 1
            ? 'Chiết khấu sản phẩm'
            : (campaignDetail?.mktFindCampaign?.type == 2
              ? 'FlashSale'
              : 'Chương trình khác')}`
        }
      >
        <meta
          name="description"
          content={
            'UB - ' + `${campaignDetail?.mktFindCampaign?.type == 1
              ? 'Chiết khấu sản phẩm'
              : (campaignDetail?.mktFindCampaign?.type == 2
                ? 'FlashSale'
                : 'Chương trình khác')}`
          }
        />
      </Helmet>
      <div>
        <Formik
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validateSchema}
        >
          {({ values, touched, errors, setFieldValue, handleSubmit, validateForm, setValues }) => {
            const changed = values['__changed__'];

            return (

              <Form>
                <RouterPrompt
                  when={changed}
                  title={formatMessage({ defaultMessage: 'Bạn đang sửa chi tiết CTKM. Mọi thông tin bạn tạo trước đó sẽ bị xoá nếu bạn thoát màn hình này. Bạn có chắc chắn muốn thoát?' })}
                  cancelText={formatMessage({ defaultMessage: 'Không' })}
                  okText={formatMessage({ defaultMessage: 'Có, Thoát' })}
                  onOK={() => true}
                  onCancel={() => false}
                />
                <ModalImportCampaignDiscount
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

                <InfoCampaign
                  isEdit
                  saleStatus={saleStatus}
                  setShowWarningPrompt={setShowWarningPrompt}
                  isActionView={action != 'edit'}
                  channelDetail={channelDetail}
                />

                <DetailCampaignEdit
                  idCampaign={params?.id}
                  campaignDetail={campaignDetail?.mktFindCampaign}
                  isActionView={action != 'edit'}
                  productSelect={productSelect}
                  setProductSelect={setProductSelect}
                  setShowWarningItemType={setShowWarningItemType}
                  setShowImportCampaignItems={setShowImportCampaignItems}
                  setShowImportCampaignDiscount={setShowImportCampaignDiscount}
                  setShowAddProduct={setShowAddProduct}
                  createFrameImgBatch={createFrameImgBatch}
                  removeFrameImgBatch={removeFrameImgBatch}
                />

                <div className='form-group d-flex justify-content-end mt-8 group-button-fixed-bottom pr-10' style={{ zIndex: 9 }}>
                  {action != 'edit' && values?.type != 'other' && <button
                    className="btn btn-primary btn-elevate"
                    style={{ padding: '10px 20px' }}
                    onClick={async (e) => {
                      e.preventDefault();
                      history.push(
                        `/marketing/sale-list`
                      );
                    }}
                  >
                    {formatMessage({ defaultMessage: 'Đóng' })}
                  </button>}
                  {values?.type == 'other' && <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      history.push(
                        `/marketing/sale-list`
                      );
                    }}
                    className="btn btn mr-3"
                    style={{ border: "1px solid #ff5629", color: "#ff5629" }}
                  >
                    {formatMessage({ defaultMessage: 'HỦY BỎ' })}
                  </button>}
                  {action == 'edit' && <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        history.push(
                          `/marketing/sale-list`
                        );
                      }}
                      className="btn btn mr-3"
                      style={{ border: "1px solid #ff5629", color: "#ff5629" }}
                    >
                      {formatMessage({ defaultMessage: 'HỦY BỎ' })}
                    </button>
                    <button
                      className="btn btn-primary btn-elevate"
                      style={{ padding: '10px 20px' }}
                      onClick={async (e) => {
                        e.preventDefault();
                        setFieldValue('__changed__', false)
                        const totalError = await validateForm()
                        console.log(totalError)
                        if (!values?.frame?.url && values['on_create_schedule_frame']) {
                          addToast(formatMessage({ defaultMessage: 'Vui lòng chọn khung ảnh mẫu' }), { appearance: 'error' })
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
                          return;
                        } else {
                          onSaveCampaign(values, false)
                        }
                      }}
                    >
                      {formatMessage({ defaultMessage: 'CẬP NHẬT' })}
                    </button>
                    <AuthorizationWrapper keys={['marketing_list_approved']}>
                      {saleStatus == 'pending' && <button
                        className="btn btn-primary btn-elevate ml-4"
                        style={{ padding: '10px 20px' }}
                        onClick={async (e) => {
                          setFieldValue('__changed__', false)
                          const totalError = await validateForm()
                          if (!values?.frame?.url && values['on_create_schedule_frame']) {
                            addToast(formatMessage({ defaultMessage: 'Vui lòng chọn khung ảnh mẫu' }), { appearance: 'error' })
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
                            return;
                          } else {
                            onSaveCampaign(values, true)
                          }
                        }}
                      >
                        {formatMessage({ defaultMessage: 'DUYỆT' })}
                      </button>
                      }
                    </AuthorizationWrapper>
                  </>}
                </div>
              </Form>)
          }}
        </Formik>

      </div>
    </Fragment>
  );
};

const CampaignDetailWrapper = () => {
  return (
    <MarketingProvider>
      <CampaignDetail />
    </MarketingProvider>
  )
}

export default CampaignDetailWrapper;
