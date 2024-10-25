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
import mutate_userHideProduct from "../../../../graphql/mutate_userHideProduct";
import mutate_scProductSyncDown from "../../../../graphql/mutate_scProductSyncDown";
import mutate_scRemoveProductFrameImages from '../../../../graphql/mutate_scRemoveProductFrameImages';
import { useToasts } from "react-toast-notifications";
import { useHistory } from 'react-router-dom';
import mutate_scProductRemoveOnStore from "../../../../graphql/mutate_scProductRemoveOnStore";
import mutate_scProductReload from '../../../../graphql/mutate_scProductReload';
import mutate_scProductSyncUpOnly from "../../../../graphql/mutate_scProductSyncUpOnly";
import ProductCreateFrameImg from "./dialog/ProductCreateFrameImg";
import LoadingDialog from "./dialog/LoadingDialog";
import query_scStoreProductSync from '../../../../graphql/query_scStoreProductSync';
import _ from 'lodash';
import DrawerModal from '../../../../components/DrawerModal';
import ProductFilterDrawer from "../products-list/filter/ProductFilterDrawer";
import { Formik } from "formik";
import * as Yup from "yup";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';

export default memo(() => {
  const history = useHistory();
  const [confirmSyncDownId, setConfirmSyncDownId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const { messages, formatMessage } = useIntl()
  const { addToast, removeAllToasts } = useToasts();
  const [categorySelected, onSelect] = useState()
  const [idJobSync, setIdJobSync] = useState(null);
  const [showError, setShowError] = useState(false);
  const [productNotImgOrigin, setProductNotImgOrigin] = useState([]);
  const [isShowCreateFrameImg, setIsShowCreateFrameImg] = useState(false);
  const [idsFrameImg, setIdsFrameImg] = useState([]);
  const [productHasTemplateOrigin, setProductHasTemplateOrigin] = useState([]);
  const [syncImg, setSyncImg] = useState(null);
  const [isOpenDrawer, setOpenDrawer] = useState(false);
  const { setIds } = useProductsUIContext();

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

  const [scProductSyncUp, { loading: loadingProductSyncUp }] = useMutation(mutate_scProductSyncUpOnly, {
    refetchQueries: ['ScGetSmeProducts', 'sme_catalog_notifications', 'scStatisticScProducts'],
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

  const [scProductReload, { loading: loadingProductReload }] = useMutation(mutate_scProductReload, {
    refetchQueries: ['ScGetSmeProducts'],
    awaitRefetchQueries: true,
    onCompleted: (data) => {
      setIds([])
    }
  });

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
        // setIds([]);
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
        message: 'Vui lòng chọn sản phẩm để thao tác',
      })
      return
    }
    setShowConfirm({
      message: params.action_type == 1 ? formatMessage({defaultMessage:'Bạn có chắc chắn muốn xoá sản phẩm? Sản phẩm đã phát sinh doanh thu nếu xóa sẽ ảnh hưởng tới các thống kê/báo cáo trước đó. Bạn có thể chọn ẩn hoặc cài đặt tồn kho sản phẩm bằng 0 để ẩn sản phẩm trên sàn.'}) : (params.action_type == 2 ? formatMessage({defaultMessage:'Bạn có chắc chắn muốn ẩn sản phẩm này?'}) : formatMessage({defaultMessage:'Bạn có chắc chắn muốn hiện sản phẩm này?'})),
      message_success: params.action_type == 1 ? formatMessage({defaultMessage:'Hệ thống đang thực hiện xoá các sản phẩm đã chọn'}) : (params.action_type == 2 ? formatMessage({defaultMessage:'Hệ thống đang thực hiện ẩn các sản phẩm đã chọn'}) : formatMessage({defaultMessage:'Hệ thống đang thực hiện hiện các sản phẩm đã chọn'})),
      params: params,
      titleConfirm: params.action_type == 1 ? formatMessage({defaultMessage:'Có, xoá'}) : formatMessage({defaultMessage:'Tiếp tục'}),
    })
  }, []);

  const _onUpdateProduct = useCallback(
    ({ list_product, urlTo, product_has_template_origin }) => {
      if (!list_product || list_product.length == 0) {
        removeAllToasts();
        addToast(formatMessage({defaultMessage:'Vui lòng chọn sản phẩm để thao tác'}), { appearance: 'warning' });
        return
      }

      if (product_has_template_origin?.length > 0) {
        setProductHasTemplateOrigin(product_has_template_origin);
        return;
      }

      history.push({
        pathname: urlTo,
        state: {
          list_product,
          from: 'draf'
        }
      })
    }, []
  );

  const _createBatch = useCallback(async (params) => {
    if (!params.list_product_id || params.list_product_id.length == 0) {
      setShowConfirm({
        message: formatMessage({defaultMessage:'Vui lòng chọn sản phẩm để thao tác'}),
      })
      return
    }
    if (!params.isPass) {
      setShowError(true);
      return;
    }
    let res = await scProductSyncDown({
      variables: {
        store_id: params.store_id,
        products: params.list_product_id
      }
    });
    if (!!res?.data?.scProductSyncDown?.sync_product_job_id) {
      setIdJobSync(res?.data?.scProductSyncDown?.sync_product_job_id);
    } else {
      setShowError(true)
    }
  }, []);

  const _onProductSyncUp = useCallback(
    async (params) => {
      if (!params.list_product_id || params.list_product_id.length == 0) {
        setShowConfirm({
          message: formatMessage({defaultMessage:'Vui lòng chọn sản phẩm để thao tác'}),
        })
        return
      }

      let res = await scProductSyncUp({
        variables: {
          products: params.list_product_id
        }
      });

      if (!!res?.data?.scProductSyncUpOnly?.success) {
        addToast(res?.data?.scProductSyncUpOnly?.message || formatMessage({defaultMessage:'Đăng bán sản phẩm thành công'}), { appearance: 'success' });
      } else {
        addToast(res?.data?.scProductSyncUpOnly?.message || formatMessage({defaultMessage:'Đăng bán sản phẩm thất bại'}), { appearance: 'error' });
      }
      setIds([])
    }, []
  );

  const _createFrameImgBatch = useCallback(async (params) => {
    if (!params.list_product_id || params.list_product_id.length == 0) {
      setShowConfirm({
        message: formatMessage({defaultMessage:'Vui lòng chọn sản phẩm để thao tác'}),
      })
      return
    }

    if (params?.product_not_img_origin?.length > 0) {
      setProductNotImgOrigin(params?.product_not_img_origin);
      return;
    }

    setIsShowCreateFrameImg(true);
    setIdsFrameImg(params.list_product_id);
  }, [setIsShowCreateFrameImg, setIdsFrameImg]);

  const _removeFrameImgBatch = useCallback(
    async (params) => {
      if (!params.list_product_id || params.list_product_id.length == 0) {
        setShowConfirm({
          message: formatMessage({defaultMessage:'Vui lòng chọn sản phẩm để thao tác'}),
        })
        return
      }

      let res = await scRemoveProductFrameImg({
        variables: {
          products: params.list_product_id
        }
      });

      if (!!res?.data?.scRemoveProductFrameImages?.success) {
        addToast(res?.data?.message || formatMessage({defaultMessage:'Xoá khung ảnh hàng loạt thành công'}), { appearance: 'success' });
      } else {
        addToast(res?.data?.message || formatMessage({defaultMessage:'Xoá khung ảnh hàng loạt thất bại'}), { appearance: 'error' });
      }
      setIds([])
    }, []
  );

  const _reloadProduct = useCallback(
    async (params) => {
      let res = await scProductReload({
        variables: {
          products: params.product_id
        }
      });

      if (res?.data?.scProductReLoad?.success) {
        addToast(formatMessage({defaultMessage:'Bắt đầu tải lại sản phẩm'}), { appearance: 'success' });
      } else {
        addToast(res?.data?.scProductReLoad?.message || res?.errors[0]?.message, { appearance: 'error' });
      }
    }, []
  );

  const onToggleDrawer = useCallback(() => setOpenDrawer(prev => !prev), [setOpenDrawer]);

  return (
    <>
      <Helmet
        titleTemplate={formatMessage({defaultMessage:"Lưu nháp trên UpBase"}) + "- UpBase"}
        defaultTitle={formatMessage({defaultMessage:"Lưu nháp trên UpBase"}) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({defaultMessage:"Lưu nháp trên UpBase"}) + "- UpBase"} />
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
                setFieldValue={setFieldValue}
              />
            </DrawerModal>
          }
        }
      </Formik>
      <Card>
        <CardBody>
          <ProductsFilter
            onDelete={_deleteProduct}
            onHide={_hideProduct}
            onUpdateProduct={_onUpdateProduct}
            onCreateBatch={_createBatch}
            onRemoveFrameImgBatch={_removeFrameImgBatch}
            onCreateFrameImgBatch={_createFrameImgBatch}
            categorySelected={categorySelected}
            onProductSyncUp={_onProductSyncUp}
            onSelect={onSelect}
            onToggleDrawer={onToggleDrawer}
          />
          <ProductsTable
            onDelete={_deleteProduct}
            onHide={_hideProduct}
            onConfirmSyncDown={setConfirmSyncDownId}
            categorySelected={categorySelected}
            onSelect={onSelect}
            onProductSyncUp={_onProductSyncUp}
            onReload={_reloadProduct}
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

        <LoadingDialog show={loading || loadingProductSyncUp} />

        <Modal
          show={showError}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setShowError(false)}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-2" >
            {formatMessage({defaultMessage:'Bạn chỉ có thể thực hiện chức năng này với những sản phẩm sàn chưa được liên kết với sản phẩm kho.'})}
            </div>
            <div className="mb-4" >
            {formatMessage({defaultMessage:'Vui lòng kiểm tra danh sách sản phẩm bạn đã chọn.'})}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: 80 }}
              onClick={() => setShowError(false)}
            >
              {formatMessage({defaultMessage:'Đóng'})}
            </button>
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
                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Huỷ'})}</span>
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
                      addToast(showConfirm.message_success, { appearance: 'success' });
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
          show={productHasTemplateOrigin?.length > 0}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setProductHasTemplateOrigin([])}
        >
          <Modal.Body className="overlay overlay-block cursor-default">
            <div className="mb-4" style={{ fontSize: 16 }}>
            {formatMessage({defaultMessage:'Sản phẩm đã có ảnh sản phẩm gốc được thêm khung, vui lòng xoá khung ảnh trước khi thao tác'})}:
            </div>
            <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
              {productHasTemplateOrigin?.map((_productName, _index) => (
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
                className="btn btn-primary btn-elevate mr-3"
                style={{ width: 90 }}
                onClick={() => setProductHasTemplateOrigin([])}
              >
                <span className="font-weight-boldest">{formatMessage({defaultMessage:'ĐÓNG'})}</span>
              </button>
            </div>
          </Modal.Body>
        </Modal>

        <Modal
          show={!!confirmSyncDownId}
          aria-labelledby="example-modal-sizes-title-lg"
          centered
          onHide={() => setConfirmSyncDownId(null)}
        >
          <Modal.Body className="overlay overlay-block cursor-default text-center">
            <div className="mb-4" >{formatMessage({defaultMessage:'Sản phẩm chưa được lưu xuống UpBase. Bạn có muốn lưu sản phẩm này xuống UpBase không'})}?</div>

            <div className="form-group mb-0">
              <button
                className="btn btn-light btn-elevate mr-3"
                style={{ width: 90 }}
                onClick={() => setConfirmSyncDownId(null)}
              >
                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Không'})}</span>
              </button>
              <button
                className={`btn btn-primary font-weight-bold`}
                style={{ width: 90 }}
                onClick={async () => {
                  let res = await scProductSyncDown({
                    variables: confirmSyncDownId
                  })
                  if (!!res?.data?.scProductSyncDown?.success) {
                    addToast('Bắt đầu lưu xuống Upbase', { appearance: 'success' });
                  } else {
                    addToast(res?.data?.scProductSyncDown?.message || res.errors[0].message, { appearance: 'error' });
                  }
                  setConfirmSyncDownId(null)
                }}
              >
                <span className="font-weight-boldest">{formatMessage({defaultMessage:'Đồng ý'})}</span>
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
  "product_store_list_draft_view": {
    router: '/product-stores/draf',
    actions: [
      "sc_stores", 
      "op_connector_channels", 
      "sc_sale_channel_categories", 
      "scStatisticScProducts", 
      "ScGetSmeProducts",
      "sc_store_product_sync"
    ],
    name: 'Xem danh sách lưu nháp trên UpBase',
    group_code: 'product_store_list_draft',
    group_name: 'Lưu nháp trên Upbase',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_draft_detail": {
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
    name: 'Xem chi tiết sản phẩm lưu nháp',
    group_code: 'product_store_draft_detail',
    group_name: 'Chi tiết sản phẩm lưu nháp',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_draft_edit": {
    router: '',
    actions: [
      "scProductSyncUpOnly", 
      "scUpdateProduct"
    ],
    name: 'Cập nhật sản phẩm lưu nháp',
    group_code: 'product_store_draft_detail',
    group_name: 'Chi tiết sản phẩm lưu nháp',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_list_draft_action": {
    router: '',
    actions: [
      "ScAddTagsMultipleProduct",
      "scRemoveProductFrameImages",
      'ScGetSmeProducts', 
      'sme_catalog_notifications',
      "scProductRemoveOnStore"
    ],
    name: 'Các thao tác thuộc màn lưu nháp',
    group_code: 'product_store_list_draft',
    group_name: 'Lưu nháp trên Upbase',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
};