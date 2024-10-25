import React, { memo, useCallback, useMemo, useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardHeaderToolbar,
} from "../../../../_metronic/_partials/controls";
import { ProductsFilter } from "./filter/ProductsFilter";
import { ProductsTable } from "./ProductsTable";
import { useProductsUIContext } from "../ProductsUIContext";
import { FormattedMessage, useIntl } from "react-intl";
import { Modal } from "react-bootstrap";
import { useMutation, useQuery } from "@apollo/client";
import mutate_scProductSyncDown from "../../../../graphql/mutate_scProductSyncDown";
import mutate_scRemoveProductFrameImages from '../../../../graphql/mutate_scRemoveProductFrameImages';
import { useToasts } from "react-toast-notifications";
import mutate_scProductRemoveOnStore from "../../../../graphql/mutate_scProductRemoveOnStore";
import mutate_scProductReload from '../../../../graphql/mutate_scProductReload';
import ProductCreateFrameImg from "./dialog/ProductCreateFrameImg";
import LoadingDialog from "./dialog/LoadingDialog";
import query_scStoreProductSync from '../../../../graphql/query_scStoreProductSync';
import _ from 'lodash';
import mutate_scAddTagsMutilpleProduct from "../../../../graphql/mutate_scAddTagsMutilpleProduct";
import mutate_scUnLinkMultipleProduct from "../../../../graphql/mutate_ scUnLinkMultipleProduct";
import CreatableSelect from 'react-select/creatable';
import DrawerModal from '../../../../components/DrawerModal';
import ProductFilterDrawer from "./filter/ProductFilterDrawer";
import { Formik } from "formik";
import * as Yup from "yup";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import ProductCloneDialog from "./dialog/ProductCloneDialog";
import { useHistory } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProductAutoLink from "./dialog/ProductAutoLink";
import ProductAutoLinkInfo from "./dialog/ProductAutoLinkInfo";
import { queryCheckExistSkuMain } from "../../Products/ProductsUIHelpers";
import ModalLoadFrameImage from "./dialog/ModalLoadFrameImage";
import ModalInprogress from "../../Order/order-list-batch/dialog/ModalInprogress";
import ModalProductsInprogress from "./dialog/ModalProductsInprogress";
import ModalReloadResult from "./dialog/ModalReloadResult";
import { formatTimestamp } from "../ProductsUIHelpers";
import { formatNumberToCurrency } from "../../../../utils";
import ModalChooseActions from "./dialog/ModalChooseActions";
import ModalRemoveMutipleActions from "./dialog/ModalRemoveMutipleActions";

export default memo(() => {
  const history = useHistory();
  const [confirmSyncDownId, setConfirmSyncDownId] = useState(null)
  const [showModalHideProductInfringing, setShowModalHideProductInfringing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showRemoveActions, setShowRemoveAction] = useState(false)
  const { formatMessage } = useIntl()
  const { addToast, removeAllToasts } = useToasts();
  const [categorySelected, onSelect] = useState()
  const [idJobSync, setIdJobSync] = useState(null);
  const [showError, setShowError] = useState(null);
  const [productNotImgOrigin, setProductNotImgOrigin] = useState([]);
  const [showErrorTemplateOrigin, setShowErrorTemplateOrigin] = useState(null);
  const [productHasTemplateOrigin, setProductHasTemplateOrigin] = useState([]);
  const [isShowCreateFrameImg, setIsShowCreateFrameImg] = useState(false);
  const [idsFrameImg, setIdsFrameImg] = useState([]);
  const [showCreateTag, setShowCreateTag] = useState(null);
  const [dataTags, setTags] = useState([]);
  const [syncImg, setSyncImg] = useState(null);
  const { setIds, optionsProductTag, ids } = useProductsUIContext();
  const [isOpenDrawer, setOpenDrawer] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showAutoLinkDialog, setShowAutoLinkDialog] = useState(false);
  const [showAutoLinkInfoDialog, setShowAutoLinkInfoDialog] = useState(false);
  const [loadingCheckExistSku, setLoadingCheckExistSku] = useState(false);

  // State load products
  const [dataResults, setDataResults] = useState(null);
  const [totalProductSuccess, setTotalProductSuccess] = useState(0);
  const [totalProductError, setTotalProductError] = useState(0);
  const [totalInprogress, setTotalInprogress] = useState(0);
  const [loadingInprogress, setLoadingInprogress] = useState(false);
  const [openModalCampaign, setOpenModalCampaign] = useState(false);
  const [campaignList, setCampaignList] = useState([]);

  const [scProductRemoveOnStore] = useMutation(mutate_scProductRemoveOnStore, {
    refetchQueries: ['ScGetSmeProducts', 'scStatisticScProducts'],
    onCompleted: (data) => {
      setIds([])
    }
  });

  const [scProductSyncDown, { loading }] = useMutation(mutate_scProductSyncDown, {
    refetchQueries: ['ScGetSmeProducts', 'sme_catalog_notifications'],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      setIds([])
    }
  });

  const [scRemoveProductFrameImg, { loading: loadingRemoveFrameImage }] = useMutation(mutate_scRemoveProductFrameImages, {
    refetchQueries: ['ScGetSmeProducts', 'sme_catalog_notifications'],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      setIds([])
    }
  });

  const [scProductReload, { loading: loadingProductReload }] = useMutation(mutate_scProductReload);

  const [createMutilTag, { loading: loadingCreateMutilTag }] = useMutation(mutate_scAddTagsMutilpleProduct, {
    refetchQueries: ['ScGetSmeProducts', 'sme_catalog_notifications'],
    onCompleted: (data) => {
      setIds([])
    }
  })

  const [unLinkMultipleProduct, { loading: loadingUnLinkMultipleProduct }] = useMutation(mutate_scUnLinkMultipleProduct, {
    refetchQueries: ['ScGetSmeProducts', 'sme_catalog_notifications'],
    onCompleted: (data) => {
      setIds([])
    }
  })

  const { data, loading: loadingSync } = useQuery(query_scStoreProductSync, {
    variables: {
      id: idJobSync,
      skip: !idJobSync
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: !idJobSync ? 0 : 500,
  });

  const currentSyncJob = useMemo(
    () => {
      if (!data?.sc_store_product_sync) {
        return null;
      }

      return {
        current: data?.sc_store_product_sync?.st_sync_total_product_processed,
        total: data?.sc_store_product_sync?.st_sync_total_product
      }
    }, [data?.sc_store_product_sync]
  );

  useEffect(
    () => {
      const notificationDiv = document.querySelector('.react-toast-notifications__container');

      // notificationDiv.style.right = 'unset';
      // notificationDiv.style.top = '50%';
      // notificationDiv.style.left = '50%';
      // notificationDiv.style.transform = 'translateX(-50%)';

      return () => {
        setIds([]);
      }
    }, []
  );

  useEffect(
    () => {
      if (!!data?.sc_store_product_sync && data?.sc_store_product_sync?.st_sync_status == 2) {
        setTimeout(
          () => {
            setIdJobSync(null);
            setIds([]);
          }, 500
        )
      }
    }, [data, setIdJobSync]
  );

  const _deleteProduct = useCallback((ids) => {
  }, [])

  const _hideProduct = useCallback(async (params) => {
    if (!params.list_product_id || params.list_product_id.length == 0) {
      setShowConfirm({
        message: formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm để thao tác' }),
      })
      return
    }
    setShowConfirm({
      message: params.action_type == 1 ? formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn xoá sản phẩm? Sản phẩm đã phát sinh doanh thu nếu xóa sẽ ảnh hưởng tới các thống kê/báo cáo trước đó. Bạn có thể chọn ẩn hoặc cài đặt tồn kho sản phẩm bằng 0 để ẩn sản phẩm trên sàn.' }) : (params.action_type == 2 ? formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn ẩn sản phẩm này?' }) : formatMessage({ defaultMessage: 'Bạn có chắc chắn muốn hiện sản phẩm này?' })),
      message_success: params.action_type == 1 ? formatMessage({ defaultMessage: 'Hệ thống đang thực hiện xoá các sản phẩm đã chọn' }) : (params.action_type == 2 ? formatMessage({ defaultMessage: 'Hệ thống đang thực hiện ẩn các sản phẩm đã chọn' }) : formatMessage({ defaultMessage: 'Hệ thống đang thực hiện hiện các sản phẩm đã chọn' })),
      params: params,
      titleConfirm: params.action_type == 1 ? formatMessage({ defaultMessage: 'Có, xoá' }) : formatMessage({ defaultMessage: 'Tiếp tục' }),
    })
  }, []);

  const _createBatch = useCallback(async (params) => {

    if (!params.products || params.products.length == 0) {
      setShowConfirm({
        message: formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm để thao tác' }),
      })
      return
    }

    setLoadingCheckExistSku(true);
    const checkedExistSkuAll = await Promise.all(params.products.map(product => {
      if (!product?.sku) {
        return false
      }
      queryCheckExistSkuMain(null, product?.sku)
    }))
    setLoadingCheckExistSku(false);

    const [productsPass, productsError] = [
      params?.products?.filter(
        (_product, index) => !_product?.sme_product_id && _product?.productVariants?.every(_variant => !_variant?.sme_product_variant_id) && !checkedExistSkuAll[index]
      ),
      params?.products?.filter(
        (_product, index) => !!_product?.sme_product_id || _product?.productVariants?.some(_variant => !!_variant?.sme_product_variant_id) || !!checkedExistSkuAll[index]
      )
    ];
    if (productsError?.length > 0) {
      setShowError({
        productsError,
        onPass: () => {
          if (productsPass?.length == 0) {
            setShowError(null);
            setIds([]);
            return;
          }
          history.push({
            pathname: params?.isSingle ? '/product-stores/single' : '/product-stores/multiple',
            state: {
              store_id: params?.store_id,
              products: productsPass,
            }
          })
        }
      });
      return;
    }

    history.push({
      pathname: '/product-stores/multiple',
      state: {
        store_id: params?.store_id,
        products: params?.products,
      }
    })
  }, []);

  const _createFrameImgBatch = useCallback(async (params) => {
    if (!params.list_product_id || params.list_product_id.length == 0) {
      setShowConfirm({
        message: formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm để thao tác' }),
      })
      return
    }

    setIdsFrameImg(params.list_product);
    if (params?.product_not_img_origin?.length > 0) {
      setProductNotImgOrigin(params?.product_not_img_origin);
      return;
    }

    setIsShowCreateFrameImg(true);
    // setIdsFrameImg(params.list_product_id);
  }, [setIsShowCreateFrameImg, setIdsFrameImg]);

  const _onUpdateProduct = useCallback(
    ({ list_product, urlTo, product_has_template_origin }) => {
      if (!list_product || list_product.length == 0) {
        removeAllToasts();
        addToast(formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm để thao tác' }), { appearance: 'warning' });
        return
      }

      if (!product_has_template_origin) {
        history.push({
          pathname: urlTo,
          state: {
            list_product,
            from: 'store'
          },
        })
        return;
      }


      const [productsPass, productsError] = [
        list_product?.filter(_product => !product_has_template_origin.some(__ => __ == _product?.name)),
        product_has_template_origin
      ];

      if (product_has_template_origin?.length > 0) {
        setShowErrorTemplateOrigin({
          productsError,
          onPass: () => {
            if (productsPass?.length == 0) {
              setShowErrorTemplateOrigin(null);
              setIds([]);
              return;
            }

            history.push({
              pathname: urlTo,
              state: {
                list_product: productsPass,
                from: 'store'
              },
            })
          }
        });
        return;
      }

      history.push({
        pathname: urlTo,
        state: {
          list_product,
          from: 'store'
        },
      })
    }, []
  );

  const _onUnlinkProduct = useCallback(
    async (params) => {
      if (!params.list_product_id || params.list_product_id.length == 0) {
        setShowConfirm({
          message: formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm để thao tác' }),
        })
        return
      }

      let res = await unLinkMultipleProduct({
        variables: {
          sc_product_ids: params.list_product_id
        }
      });

      if (!!res?.data?.scUnLinkMultipleProduct?.success) {
        addToast(res?.data?.scUnLinkMultipleProduct?.message || formatMessage({ defaultMessage: 'Huỷ liên kết hàng loạt thành công' }), { appearance: 'success' });
      } else {
        addToast(res?.data?.scUnLinkMultipleProduct?.message || formatMessage({ defaultMessage: 'Huỷ liên kết hàng loạt thất bại' }), { appearance: 'error' });
      }
      setIds([])
    }, []
  );

  const _removeFrameImgBatch = useCallback(
    async (params) => {
      if (!params.list_product_id || params.list_product_id.length == 0) {
        setShowConfirm({
          message: formatMessage({ defaultMessage: 'Vui lòng chọn sản phẩm để thao tác' }),
        })
        return
      }

      let res = await scRemoveProductFrameImg({
        variables: {
          products: params.list_product_id
        }
      });

      if (!!res?.data?.scRemoveProductFrameImages?.success) {
        addToast(res?.data?.scRemoveProductFrameImages?.message || formatMessage({ defaultMessage: 'Xoá khung ảnh hàng loạt thành công' }), { appearance: 'success' });
      } else {
        addToast(res?.data?.scRemoveProductFrameImages?.message || formatMessage({ defaultMessage: 'Xoá khung ảnh hàng loạt thất bại' }), { appearance: 'error' });
      }
      setIds([])
    }, []
  );

  const onSetDataResult = useCallback((result) => {
    setIds([]);
    setTotalInprogress(0);
    setLoadingInprogress(false);
    setTotalProductSuccess(0);
    setTotalProductError(0);
    setDataResults(result);
  }, []);

  const onReloadMutipleProducts = useCallback(async (products, count = 0, totalSuccess = 0, totalFail = 0) => {
    const result = {
      total_success: totalSuccess,
      total_fail: totalFail
    };

    const dataHandeling = products[count];
    const dataRemaning = products?.slice(count);
    try {
      setTotalInprogress(dataRemaning?.length);
      setLoadingInprogress(true);

      if (dataRemaning?.length == 0) {
        onSetDataResult(result);
        return;
      }

      const { data } = await scProductReload({
        variables: {
          products: dataHandeling?.id
        }
      });
      if (data?.scProductReLoad?.success) {
        totalSuccess += 1;
        setTotalProductSuccess(totalSuccess);
      } else {
        totalFail += 1;
        setTotalProductError(totalFail);
      }

      onReloadMutipleProducts(products, count + 1, totalSuccess, totalFail);
    } catch (error) {
      onSetDataResult(result)
    }
  }, []);

  const onReloadSingleProduct = useCallback(
    async (params) => {
      let res = await scProductReload({
        variables: {
          products: _.map(params.product, 'id')
        }
      });

      if (res?.data?.scProductReLoad?.success) {
        addToast(formatMessage({ defaultMessage: 'Bắt đầu tải lại sản phẩm' }), { appearance: 'success' });
      } else {
        addToast(res?.data?.scProductReLoad?.message || res?.errors[0]?.message, { appearance: 'error' });
      }
    }, []
  );

  const _onCreateMutilTag = useCallback(
    (ids) => {
      setShowCreateTag({
        products: ids
      })
    }, []
  );

  const onToggleDrawer = useCallback(() => setOpenDrawer(prev => !prev), [setOpenDrawer]);

  return (
    <>
      <Helmet
        titleTemplate={`${formatMessage({ defaultMessage: 'Danh sách sản phẩm sàn' })} - UpBase`}
        defaultTitle={`${formatMessage({ defaultMessage: 'Danh sách sản phẩm sàn' })} - UpBase`}
      >
        <meta name="description" content={`${formatMessage({ defaultMessage: 'Danh sách sản phẩm sàn' })} - UpBase`} />
      </Helmet>
      <Formik
        initialValues={{}}
        validationSchema={Yup.object().shape({})}
      >
        {
          ({ setFieldValue }) => {
            return <DrawerModal
              open={isOpenDrawer}
              onClose={onToggleDrawer}
              direction="right"
              size={500}
              enableOverlay={true}
            >
              <ProductFilterDrawer
                isOpenDrawer={isOpenDrawer}
                onToggleDrawer={onToggleDrawer}
                // categorySelected={categorySelected}
                // onSelect={onSelect}
                setFieldValue={setFieldValue}
              />
            </DrawerModal>
          }
        }
      </Formik>
      <ModalChooseActions
        show={isShowCreateFrameImg}        
        ids={idsFrameImg}
        onHide={() => setIsShowCreateFrameImg(false)}
        setSyncImg={setSyncImg}
      />
      <Modal
        size="sm"
        show={openModalCampaign}
        aria-labelledby="example-modal-sizes-title-sm"
        dialogClassName="modal-show-connect-product modal-campaign"
        centered
        onHide={() => { setOpenModalCampaign(false) }}
        scrollable={true}
      >
        <Modal.Header>
          <Modal.Title>{formatMessage({ defaultMessage: 'Danh sách chương trình khuyến mại' })}</Modal.Title>
          <span style={{ cursor: 'pointer' }} onClick={() => setOpenModalCampaign(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16" >
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
            </svg>
          </span>
          {/* <i
                        className="drawer-filter-icon fas fa-times icon-md text-right"
                        style={{ cursor: "pointer" }}
                        
                    /> */}
        </Modal.Header>
        <Modal.Body>
          {campaignList?.map(campaign => {
            return (
              <div>
                <div className='d-flex justify-content-between mt-4'>
                  <span style={{ fontSize: '18px' }}>{campaign?.name}</span>
                  {new Date(campaign?.start_time * 1000) > new Date() ? <span style={{ color: '#FF5629', fontSize: '16px' }}>Chưa diễn ra</span> : <span style={{ color: '#3da153', fontSize: '16px' }}>Đang diễn ra</span>}
                </div>
                <div className='d-flex justify-content-between mt-4'>
                  <span style={{ fontSize: '14px' }}>Giá khuyến mãi</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{campaign?.type == 2 ? formatNumberToCurrency(campaign?.mktItemFlashSale?.promotion_price) : formatNumberToCurrency(campaign?.mktItemDiscount?.promotion_price)}</span>
                </div>
                <div className='d-flex justify-content-between mt-4'>
                  <span style={{ fontSize: '14px' }}>Thời gian :</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{formatTimestamp(campaign?.start_time)} - {formatTimestamp(campaign?.end_time)}</span>
                </div>
              </div>
            )
          })}
        </Modal.Body>

      </Modal>
      <Card>
        <CardBody>
          {!!currentSyncJob && !!idJobSync && (
            <div style={{ background: '#ff5629', color: '#fff', padding: '10px 20px', borderRadius: 6, marginBottom: 20 }}>
              {formatMessage({ defaultMessage: 'Đang tạo sản phẩm kho' })}
              <span style={{ marginLeft: 80 }}>
                <span className="spinner" style={{ right: 30 }}></span>
                {currentSyncJob?.current}/{currentSyncJob?.total} {formatMessage({ defaultMessage: `sản phẩm` })}
              </span>
            </div>
          )}
          <ProductsFilter
            onDelete={_deleteProduct}
            onHide={_hideProduct}
            onReload={onReloadMutipleProducts}
            onUpdateProduct={_onUpdateProduct}
            onCreateMutilTag={_onCreateMutilTag}
            onCreateBatch={_createBatch}
            onRemoveFrameImgBatch={() => setShowRemoveAction(true)}
            onCreateFrameImgBatch={_createFrameImgBatch}
            onUnlinkProduct={_onUnlinkProduct}
            categorySelected={categorySelected}
            onSelect={onSelect}
            onCloneStoreProduct={() => setShowCloneDialog(true)}
            onAutoLinkProduct={setShowAutoLinkDialog}
            onAutoLinkProductInfo={setShowAutoLinkInfoDialog}
            onToggleDrawer={onToggleDrawer}
          />
          <ProductsTable
            setOpenModalCampaign={setOpenModalCampaign}
            setCampaignList={setCampaignList}
            onCreateBatch={_createBatch}
            onDelete={_deleteProduct}
            onHide={_hideProduct}
            onConfirmSyncDown={setConfirmSyncDownId}
            categorySelected={categorySelected}
            onCreateMutilTag={_onCreateMutilTag}
            onSelect={onSelect}
            onReload={onReloadSingleProduct}
            isReloadDone={dataResults}
            syncImg={syncImg}
          />
        </CardBody>
        <div
          id="kt_scrolltop1"
          className="scrolltop"
          style={{ bottom: 80 }}
          onClick={() => {
            window.scrollTo({
              letf: 0,
              top: document.body.scrollHeight,
              behavior: 'smooth'
            });
          }}
        >
          <span className="svg-icon">
            <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
          </span>{" "}
        </div>

        <LoadingDialog show={loading || loadingRemoveFrameImage || loadingProductReload || loadingCreateMutilTag || loadingUnLinkMultipleProduct || loadingCheckExistSku} />

        <ModalProductsInprogress
          show={loadingInprogress}
          total={ids?.length}
          totalInprogress={totalInprogress}
          totalProductError={totalProductError}
          totalProductSuccess={totalProductSuccess}
        />

        <ModalReloadResult
          dataResults={dataResults}
          onHide={() => setDataResults(null)}
        />

        <ModalRemoveMutipleActions
          show={showRemoveActions}
          onHide={() => setShowRemoveAction(false)}
          ids={ids}
          setIds={setIds}
        />

        <ModalLoadFrameImage
          syncImg={syncImg}
          setIds={setIds}      
          onHide={() => setSyncImg(null)}
        />

        <ProductCloneDialog
          show={showCloneDialog}
          onHide={() => setShowCloneDialog(false)}
        />
        <ProductAutoLink
          show={showAutoLinkDialog}
          onHide={setShowAutoLinkDialog}
          onShowInfo={setShowAutoLinkInfoDialog}
        />
        <ProductAutoLinkInfo
          show={showAutoLinkInfoDialog}
          onHide={setShowAutoLinkInfoDialog}
          showStep1={setShowAutoLinkDialog}
        />

        {/* <ProductCreateFrameImg
          show={isShowCreateFrameImg}
          ids={idsFrameImg}
          onHide={() => setIsShowCreateFrameImg(false)}
          setSyncImg={setSyncImg}
        /> */}

        {/* <Modal
          show={!loadingProductReload && productReload?.length > 0}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setProductReload([])}
        >
          <Modal.Body className="overlay overlay-block cursor-default">
            <div className="mb-4" style={{ fontSize: 16 }}>
            (Lưu ý) Với những sản phẩm sàn đã liên kết với sản phẩm UpBase cần để ý các thông tin sau đây khi sửa đổi ở sản phẩm UpBase:
            </div>
            <ul>
              <li style={{ fontSize: 14 }} className="mb-4">Mô tả</li>
              <li style={{ fontSize: 14 }} className="mb-4">Hình ảnh/Video sản phẩm</li>
              <li style={{ fontSize: 14 }} className="mb-4">Phân loại sản phẩm</li>
            </ul>
            <div className="form-group mb-0 mt-8 d-flex justify-content-between">
              <button
                className="btn btn-light btn-elevate mr-6"
                style={{ width: '47%' }}
                onClick={() => setProductReload([])}
              >
                <span className="font-weight-boldest">HUỶ</span>
              </button>
              <button
                className="btn btn-primary btn-elevate mr-3"
                style={{ width: '47%' }}
                onClick={async () => {
                  let res = await scProductReload({
                    variables: {
                      products: _.map(productReload, 'id')
                    }
                  });

                  setProductReload([]);
                  if (res?.data?.scProductReLoad?.success) {
                    addToast('Bắt đầu tải lại sản phẩm', { appearance: 'success' });
                  } else {
                    addToast(res?.data?.scProductReLoad?.message || res?.errors[0]?.message, { appearance: 'error' });
                  }
                }}
              >
                <span className="font-weight-boldest">XÁC NHẬN</span>
              </button>
            </div>
          </Modal.Body>
        </Modal> */}

        <Modal
          show={!!showCreateTag}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setShowCreateTag(null)}
        >
          <Modal.Header style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }} >
            <Modal.Title>{formatMessage({ defaultMessage: 'Thêm tag sản phẩm' })}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="overlay overlay-block cursor-default">
            <div className="mb-8">
              <CreatableSelect
                placeholder={formatMessage({ defaultMessage: "Nhập tag sản phẩm" })}
                isMulti
                isClearable
                onChange={value => {
                  if (value?.length > 0 && value?.some(_value => _value?.label?.trim()?.length > 255)) {
                    removeAllToasts();
                    addToast(formatMessage({ defaultMessage: 'Tag sản phẩm tối đa chỉ được 255 ký tự' }), { appearance: 'error' });
                    return;
                  }
                  setTags(value)
                }}
                options={optionsProductTag}
                formatCreateLabel={(inputValue) => formatMessage({ defaultMessage: "Tạo mới: {value}" }, { value: inputValue })}
              />
            </div>
            <div className="form-group mb-0 d-flex justify-content-between">
              <button
                className="btn btn-light btn-elevate mr-6"
                style={{ width: '47%' }}
                onClick={() => setShowCreateTag(null)}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'HUỶ' })}</span>
              </button>
              <button
                className={`btn btn-primary font-weight-bold`}
                style={{ width: '47%' }}
                onClick={async () => {
                  let body = {
                    product_ids: _.map(showCreateTag?.products || [], 'id'),
                    tags: dataTags?.map(
                      (_tag, index) => {
                        let { value, label } = _tag;
                        if (_tag?.__isNew__) {
                          return {
                            tag_name: label,
                          }
                        }
                        return {
                          id: value,
                          tag_name: label,
                        }
                      }
                    ) || []
                  };

                  setShowCreateTag(null);
                  let res = await createMutilTag({
                    variables: body
                  });

                  if (res?.data?.ScAddTagsMultipleProduct?.success) {
                    addToast(formatMessage({ defaultMessage: 'Đã thêm tag cho các sản phẩm được chọn' }), { appearance: 'success' })
                  } else {
                    addToast(res?.data?.ScAddTagsMultipleProduct?.message, { appearance: 'error' })
                  }
                  setTags([]);
                  setIds([]);
                }}
                disabled={false}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'THÊM TAG' })}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal>

        <Modal
          show={!!showError}
          aria-labelledby="example-modal-sizes-title-lg"
          dialogClassName="modal-warning-multiple-product"
          centered
          onHide={() => setShowError(null)}
        >
          <Modal.Body className="overlay overlay-block cursor-default">
            <div className="mb-4 fs-14" >
              <span className="text-danger">{showError?.productsError?.length} {formatMessage({ defaultMessage: 'sản phẩm' })}</span> {formatMessage({ defaultMessage: 'dưới đây đã có liên kết kho hoặc đã tồn tại trong kho nên sẽ không tạo được sản phẩm kho' })}:
            </div>
            <ul style={{ maxHeight: 200, overflowY: 'auto', listStyle: 'inside' }}>
              {showError?.productsError?.map((_product, _index) => (
                <li
                  key={`product-create-multiple-${_index}`}
                  className="mb-4"
                >
                  {`${_product?.name}.`}
                </li>
              ))}
            </ul>
            <div className="form-group mb-0 text-center mt-8">
              <button
                className="btn btn-secondary mr-3"
                style={{ width: 120 }}
                onClick={() => {
                  setShowError(null)
                  setIds([]);
                }}
              >
                {formatMessage({ defaultMessage: 'Hủy' })}
              </button>
              <button
                className="btn btn-primary btn-elevate mr-3"
                style={{ width: 120 }}
                onClick={() => {
                  !!showError.onPass && showError.onPass();
                }}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Tiếp tục' })}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal>

        <Modal
          show={productNotImgOrigin?.length > 0}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setProductNotImgOrigin([])}
        >
          <Modal.Body className="overlay overlay-block cursor-default">
            <div className="mb-4" style={{ fontSize: 16 }}>
              {formatMessage({ defaultMessage: `Sản phẩm chưa có ảnh gốc sẽ không thao tác được với thay khung hàng loạt cho ảnh gốc:` })}
            </div>
            <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
              {productNotImgOrigin?.map((_productName, _index) => (
                <li
                  key={`product-not-img-origin-${_index}`}
                  className="mb-4"
                >
                  {`${_productName}.`}
                </li>
              ))}
            </ul>
            <div className="form-group mb-0 text-center mt-6">
              <button
                className="btn btn-secondary mr-3"
                style={{ width: 120 }}
                onClick={() => setProductNotImgOrigin([])}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Đóng' })}</span>
              </button>
              <button
                className="btn btn-primary btn-elevate mr-3"
                style={{ width: 120 }}
                onClick={() => {
                  console.log({ idsFrameImg });
                  setProductNotImgOrigin([])
                  setIsShowCreateFrameImg(true);
                }}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: 'Tiếp tục' })}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal>

        <Modal
          show={!!showErrorTemplateOrigin}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setShowErrorTemplateOrigin(null)}
        >
          <Modal.Body className="overlay overlay-block cursor-default">
            <div className="mb-4 fs-14">
              <span className="text-danger">{showErrorTemplateOrigin?.productsError?.length} {formatMessage({ defaultMessage: `sản phẩm` })}</span> {formatMessage({ defaultMessage: `dưới đây đang được áp khung nên sẽ không được chỉnh sửa ảnh gốc và tag` })}:
            </div>
            <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
              {showErrorTemplateOrigin?.productsError?.map((_productName, _index) => (
                <li
                  key={`product-not-img-origin-${_index}`}
                  className="mb-4"
                >
                  {`+ ${_productName}.`}
                </li>
              ))}
            </ul>
            <div className="form-group mb-0 text-center mt-8">
              <button
                className="btn btn-secondary mr-3"
                style={{ width: 120 }}
                onClick={() => {
                  setShowErrorTemplateOrigin(null)
                  setIds([]);
                }}
              >
                {formatMessage({ defaultMessage: 'Hủy' })}
              </button>
              <button
                className="btn btn-primary btn-elevate mr-3"
                style={{ width: 120 }}
                onClick={() => {
                  !!showErrorTemplateOrigin.onPass && showErrorTemplateOrigin.onPass();
                }}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: `Tiếp tục` })}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal>

        <Modal
          show={!!showConfirm}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setShowConfirm(null)}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4" >{showConfirm?.message}</div>

            <div className="form-group mb-0">
              <button
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 90 }}
                onClick={() => setShowConfirm(null)}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: `Huỷ` })}</span>
              </button>
              {
                !!showConfirm?.titleConfirm && <button
                  className={`btn btn-primary font-weight-bold`}
                  style={{ width: 90 }}
                  onClick={async () => {
                    setShowConfirm(null)
                    let res = await scProductRemoveOnStore({
                      variables: showConfirm.params
                    })
                    if (res.data?.scProductRemoveOnStore?.success) {
                      if (showConfirm.params?.is_product_hide) {
                        setShowModalHideProductInfringing(true)
                      } else {
                        addToast(showConfirm.message_success, { appearance: 'success' });
                      }

                    } else {
                      addToast(res.data?.scProductRemoveOnStore?.message || res.errors[0].message, { appearance: 'error' });
                    }
                    setIds([])
                  }}
                >
                  <span className="font-weight-boldest">{showConfirm?.titleConfirm}</span>
                </button>
              }
            </div>
          </Modal.Body>
        </Modal >
        <Modal
          show={!!confirmSyncDownId}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setConfirmSyncDownId(null)}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4" >{formatMessage({ defaultMessage: `Sản phẩm chưa được lưu xuống UpBase. Bạn có muốn lưu sản phẩm này xuống UpBase không?` })}</div>

            <div className="form-group mb-0">
              <button
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 90 }}
                onClick={() => setConfirmSyncDownId(null)}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: `Không` })}</span>
              </button>
              <button
                className={`btn btn-primary font-weight-bold`}
                style={{ width: 90 }}
                onClick={async () => {
                  let res = await scProductSyncDown({
                    variables: confirmSyncDownId
                  })
                  if (!!res?.data?.scProductSyncDown?.success) {
                    addToast(formatMessage({ defaultMessage: 'Bắt đầu lưu xuống Upbase' }), { appearance: 'success' });
                  } else {
                    addToast(res?.data?.scProductSyncDown?.message || res.errors[0].message, { appearance: 'error' });
                  }
                  setConfirmSyncDownId(null)
                }}
              >
                <span className="font-weight-boldest">{formatMessage({ defaultMessage: `Đồng ý` })}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal >

        <Modal
          show={showModalHideProductInfringing}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4" >{formatMessage({ defaultMessage: `Đã ẩn sản phẩm sàn trừ các sản phẩm đang ở trạng thái Vi phạm.` })}</div>

            <div className="form-group mb-0">
              <button
                className="btn btn-primary font-weight-bold mr-3"
                style={{ width: 90 }}
                onClick={() => setShowModalHideProductInfringing(false)}
              >
                <span className="font-weight-boldest">OK</span>
              </button>
            </div>
          </Modal.Body>
        </Modal >

      </Card>
    </>
  );
}
)

export const actionKeys = {
  "product_store_view": {
    router: '/product-stores/list',
    actions: [
      "sc_stores",
      "op_connector_channels",
      "sc_sale_channel_categories",
      "scStatisticScProducts",
      "ScGetSmeProducts",
      "sc_store_product_sync",
      "sme_warehouses",
      "sme_catalog_product",
      "sme_catalog_product_aggregate",
      "mktGetCampaignByVariant",
      "ScTags",
      "sme_catalog_photo_frames",
      "sme_catalog_product_variant_by_pk",
      "sme_catalog_inventories",
      "sme_catalog_product_by_pk",
      "sc_product_variant",
      "sc_product",
      "scListPrefixName",
    ],
    name: 'Xem danh sách sản phẩm sàn',
    group_code: 'product_store_list',
    group_name: 'Xem danh sách sản phẩm sàn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_detail": {
    router: '/product-stores/edit/:id',
    actions: [
      "sc_stores",
      "op_connector_channels",
      "sme_catalog_product_by_pk",
      "ScTags", "sme_warehouses",
      "sc_sale_channel_categories",
      "sc_product", "scGetWarehouses",
      "sme_catalog_photo_frames",
      "scGetCategorySuggestion",
      "scStatisticScProducts",
      "ScGetSmeProducts"
    ],
    name: 'Xem chi tiết sản phẩm sàn',
    group_code: 'product_store_detail',
    group_name: 'Xem chi tiết sản phẩm sàn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_create": {
    router: '/product-stores/new',
    actions: [
      "sc_stores",
      "op_connector_channels",
      "sme_catalog_product_by_pk",
      "ScTags",
      "sme_warehouses",
      "sc_sale_channel_categories",
      "sc_product",
      "scGetWarehouses",
      "sme_catalog_photo_frames",
      "scGetCategorySuggestion",
      "scCreateProduct",
      "scProductSyncUpOnly",
      "scStatisticScProducts",
      "ScGetSmeProducts",
      "ScCreateMultipleProduct",
      "scGetLogisticChannel"
    ],
    name: 'Thêm mới sản phẩm sàn',
    group_code: 'product_store_create',
    group_name: 'Thêm mới sản phẩm sàn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_edit": {
    router: '',
    actions: [
      "scProductSyncUpOnly",
      "scUpdateProduct",
      'ScGetSmeProducts',
      'ScTags'
    ],
    name: 'Cập nhật sản phẩm sàn',
    group_code: 'product_store_detail',
    group_name: 'Cập nhật sản phẩm sàn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_clone": {
    router: '',
    actions: [
      "sc_stores",
      "op_connector_channels",
      "scGetTotalProductClone",
      "scCloneStoreProduct",
      'ScGetSmeProducts',
      'sme_catalog_notifications'
    ],
    name: 'Sao chép sản phẩm ',
    group_code: 'product_store_list',
    group_name: 'Danh sách sản phẩm sàn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_remove": {
    router: '',
    actions: [
      "scProductRemoveOnStore",
      'ScGetSmeProducts',
      'scStatisticScProducts'
    ],
    name: 'Xóa sản phẩm sàn',
    group_code: 'product_store_list',
    group_name: 'Danh sách sản phẩm sàn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_action": {
    router: '',
    actions: [
      "ScAddTagsMultipleProduct",
      "scProductReLoad",
      "scRemoveProductFrameImages",
      'ScGetSmeProducts',
      'sme_catalog_notifications',
      "scProductRemoveOnStore",
      "sc_composite_image_sync",
      "scActionMultipleProduct",
    ],
    name: 'Các thao tác thuộc màn danh sách',
    group_code: 'product_store_list',
    group_name: 'Danh sách sản phẩm sàn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_create_sme_product": {
    router: '',
    actions: [
      "scProductSyncDown",
      'ScGetSmeProducts',
      'sme_catalog_notifications'
    ],
    name: 'Tạo sản phẩm kho từ sàn',
    group_code: 'product_store_list',
    group_name: 'Danh sách sản phẩm sàn',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_connect": {
    router: '',
    actions: [
      'sc_product',
      "sme_catalog_product",
      "scLinkSmeProductToConnector",
      "scSumProductToAutoLink",
      "scAutoLinkSmeProduct",
      "storeChecklistUpdateStatus",
      "scUnLinkSmeProductToConnector",
      "scGetProductVariantLinked"
    ],
    name: 'Liên kết sản phẩm',
    group_code: 'product_connect',
    group_name: 'Liên kết',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_variant_connect": {
    router: '',
    actions: [
      'sc_product',
      'sme_catalog_product_by_pk',
      "scLinkSmeProductVariantToConnector",
      "scUnLinkSmeProductVariantToConnector",
      "sme_catalog_inventories_by_variant",
      "sme_catalog_inventories"
    ],
    name: 'Liên kết hàng hóa',
    group_code: 'product_connect',
    group_name: 'Liên kết',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_connect_view": {
    router: '/product-stores/connect',
    actions: [
      "sc_stores",
      "op_connector_channels",
      "scGetJobAutoLinkSmeProduct",
      "sc_sale_channel_categories",
      "scStatisticScProducts",
      "scStatisticSmeVariants",
      "ScGetSmeProducts",
      "sc_product",
      "sme_catalog_product",
      "ScTags",
      "sme_warehouses",
      "scGetProductVariantLinked"
    ],
    name: 'Xem liên kết',
    group_code: 'product_connect',
    group_name: 'Liên kết',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  }
};