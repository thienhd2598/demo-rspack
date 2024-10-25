import React, { memo, useCallback, useMemo, useState } from "react";
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
import { useMutation } from "@apollo/client";
import mutate_userHideProduct from "../../../../graphql/mutate_userHideProduct";
import mutate_scProductSyncUp_raw from "../../../../graphql/mutate_scProductSyncUp_raw";
import { Link } from "react-router-dom";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';

export default memo(() => {
  const [showConfirm, setShowConfirm] = useState(false)
  const [storeDisconnect, setStoreDisconnect] = useState([])
  const {formatMessage} = useIntl()
  const [hideProduct] = useMutation(mutate_userHideProduct, {
    refetchQueries: ['sme_catalog_product', 'sme_catalog_product_aggregate']
  })

  const _deleteProduct = useCallback((ids) => {
    setShowConfirm({
      message: ids.length > 1 ? formatMessage({defaultMessage:'Bạn có chắc chắn muốn xoá những sản phẩm này?'}) : formatMessage({defaultMessage:'Bạn có chắc chắn muốn xoá sản phẩm này?'}),
      action: 'delete',
      params: ids
    })
  }, [])

  const _hideProduct = useCallback(async (ids) => {
    await hideProduct({
      variables: {
        id: ids,
        is_delete: false
      }
    })
  }, [])
  return (
    <Card>
      <Helmet
        titleTemplate={formatMessage({defaultMessage:"Quản lý đồng bộ"}) + "- UpBase"}
        defaultTitle={formatMessage({defaultMessage:"Quản lý đồng bộ"}) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({defaultMessage:"Quản lý đồng bộ"}) + "- UpBase"} />
      </Helmet>
      <CardHeader title={formatMessage({defaultMessage:'Quản lý đồng bộ'})}>
      </CardHeader>
      <CardBody>
        <ProductsFilter
          onDelete={_deleteProduct}
          onHide={_hideProduct}
          setStoreDisconnect={setStoreDisconnect}
        />
        <ProductsTable
          onDelete={_deleteProduct}
          onHide={_hideProduct}
          setStoreDisconnect={setStoreDisconnect}
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
            <button
              className={`btn btn-primary font-weight-bold`}
              style={{ width: 90 }}
              onClick={async () => {
                setShowConfirm(null)

                await hideProduct({
                  variables: {
                    id: showConfirm.params,
                    is_delete: true
                  }
                })
              }}
            >
              <span className="font-weight-boldest">{formatMessage({defaultMessage:'Có, Xoá'})}</span>
            </button>
          </div>
        </Modal.Body>
      </Modal >

      <Modal
        show={storeDisconnect?.length != 0}
        aria-labelledby="example-modal-sizes-title-lg"
        centered
        onHide={() => setStoreDisconnect([])}
      >
        <Modal.Body className="overlay overlay-block cursor-default text-center">
          <div className="mb-4" >{formatMessage({defaultMessage:'Kết nối đến gian hàng'})} {storeDisconnect?.join(', ')} {formatMessage({defaultMessage:'không khả dụng. Vui lòng kết nối lại để thực hiện thao tác này'})}.</div>

          <div className="form-group mb-0">
            <button
              type="button"
              className="btn btn-light btn-elevate mr-3"
              style={{ width: 150 }}
              onClick={() => setStoreDisconnect([])}
            >
              <span className="font-weight-boldest">{formatMessage({defaultMessage:'Bỏ qua'})}</span>
            </button>
            <Link
              type="button"
              to='/setting/channels'
              className={`btn btn-primary font-weight-bold`}
              style={{ width: 150 }}
            >
              <span className="font-weight-boldest">{formatMessage({defaultMessage:'Kết nối lại'})}</span>
            </Link>
          </div>
        </Modal.Body>
      </Modal >
    </Card>
  );
}
)

export const actionKeys = {
  "product_store_sync_view": {
    router: '/product-stores/syncs',
    actions: [
      "sc_stores", "op_connector_channels", "scStatisticUpbaseSmeProducts", 
      "sme_catalog_product_aggregate", "scGetUpbaseSmeProducts", "ScTags", "sme_warehouses"
    ],
    name: 'Xem danh sách quản lý',
    group_code: 'product_store_sync',
    group_name: 'Quản lý đồng bộ ',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
  "product_store_sync_up": {
    router: '',
    actions: [
      "scProductSyncUpOnly", 'scGetUpbaseSmeProducts', 'scStatisticUpbaseSmeProducts'
    ],
    name: 'Đồng bộ',
    group_code: 'product_store_sync',
    group_name: 'Quản lý đồng bộ',
    cate_code: 'product_store_service',
    cate_name: 'Quản lý sàn',
  },
};