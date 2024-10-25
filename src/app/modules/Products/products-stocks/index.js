import React, { memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
} from "../../../../_metronic/_partials/controls";
import { ProductsFilter } from "./filter/ProductsFilter";
import { ProductsTable } from "./ProductsTable";
import { useProductsUIContext } from "../ProductsUIContext";
import { useMutation, useQuery } from "@apollo/client";
import mutate_userHideProduct from "../../../../graphql/mutate_userHideProduct";
import mutate_userShowProduct from "../../../../graphql/mutate_userShowProduct";
import mutate_smeUpdateProductTagsMutil from "../../../../graphql/mutate_smeUpdateProductTagsMutil";
import { useToasts } from "react-toast-notifications";
import mutate_scUnLinkSmeProductToConnector from "../../../../graphql/mutate_scUnLinkSmeProductToConnector";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";
import { useHistory, useLocation } from "react-router-dom";
import _ from "lodash";
import LoadingDialog from "./dialog/LoadingDialog";
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useSubheader } from "../../../../_metronic/layout";
import ModalUpdateStockWarning from "./dialog/ModalUpdateStockWarning";
import ModalUpdatePrice from "./dialog/ModalUpdatePrice";
import { useIntl } from "react-intl";
import queryString from 'querystring'
export default memo(() => {
  const history = useHistory();
  const params = queryString.parse(useLocation().search.slice(1, 100000))
  const location = useLocation();
  const { ids } = useProductsUIContext();
  const [showUpdateStockWarning, setshowUpdateStockWarning] = useState(false)
  const [showUpdatePrice, setshowUpdatePrice] = useState(false)
  const [showConfirmCreateMulti, setConfirmCreateMulti] = useState(false)
  const [channelSelected, setChannelSelected] = useState(null)
  const [showCreateTag, setShowCreateTag] = useState(null);
  const [dataTags, setTags] = useState([]);
  const [dataUpdateProduct, setDataUpdateProduct] = useState(null);
  const { formatMessage } = useIntl()

  const { addToast, removeAllToasts } = useToasts();
  const [hideProduct] = useMutation(mutate_userHideProduct, {
    refetchQueries: ['sme_catalog_product', 'sme_catalog_product_aggregate']
  })
  const [unlinkProduct] = useMutation(mutate_scUnLinkSmeProductToConnector)

  const [userShowProduct] = useMutation(mutate_userShowProduct, {
    refetchQueries: ['sme_catalog_product', 'sme_catalog_product_aggregate']
  })
  const [createMutilTag, { loading: loadingCreateMutilTag }] = useMutation(mutate_smeUpdateProductTagsMutil, {
    refetchQueries: ['sme_catalog_product', 'sme_catalog_product_aggregate', 'sme_catalog_product_tags']
  })


  const _hideUpdateStockWarning = useCallback(() => {
    setshowUpdateStockWarning(false)
  }, [])
  const _hideUpdatePrice = useCallback(() => {
    setshowUpdatePrice(false)
  }, [])
  const { setBreadcrumbs } = useSubheader()


  useLayoutEffect(() => {
    setBreadcrumbs([
      {
        title: formatMessage({ defaultMessage: 'Tồn kho' }),
      },
    ])
  }, []);

  return (
    <>
      <Helmet
        titleTemplate={formatMessage({ defaultMessage: "Tồn kho" }) + "- UpBase"}
        defaultTitle={formatMessage({ defaultMessage: "Tồn kho" }) + "- UpBase"}
      >
        <meta name="description" content={formatMessage({ defaultMessage: "Tồn kho" }) + "- UpBase"} />
      </Helmet>
      <div style={{ position: 'relative', zIndex: '10', background: '#fff', fontSize: 14, paddingTop: 10, flex: 1 }}>
        <ul className="nav nav-tabs" id="myTab" role="tablist" style={{ borderBottom: 'none' }} >
          <li className={`product-status-nav nav-item ${!params.status ? 'active' : ''}`}>
            <a className={`nav-link font-weight-normal ${!params.status ? 'active' : ''}`}
              style={{ fontSize: '13px', minWidth: 100, }}
              onClick={e => {
                history.push(`/products/stocks?${queryString.stringify({
                  ...params,
                  page: 1,
                  status: undefined,
                  products_status: undefined,
                  type: undefined,
                  name: undefined,
                  warehouseid: undefined
                })}`)
              }}
            >{formatMessage({ defaultMessage: 'Trạng thái mới' })}</a>
          </li>
          <li className={`product-status-nav nav-item ${params.status == 'defective' ? 'active' : ''}`}>
            <a className={`nav-link font-weight-normal ${params.status == "defective" ? 'active' : ''}`}
              style={{ fontSize: '13px', minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
              onClick={e => {
                history.push(`/products/stocks?${queryString.stringify({
                  ...params,
                  page: 1,
                  status: 'defective',
                  products_status: undefined,
                  type: undefined,
                  name: undefined,
                  warehouseid: undefined,

                })}`)
              }}
            >
              {formatMessage({ defaultMessage: 'Trạng thái khác' })}
            </a>
          </li>
        </ul>
      </div>
      <Card>
        <CardBody style={{ borderTop: '0.5px solid #cbced4' }}>
          <ProductsFilter />
          <ProductsTable showUpdateStockWarning={setshowUpdateStockWarning}
            showUpdatePrice={setshowUpdatePrice} />
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

        <LoadingDialog show={loadingCreateMutilTag} />
      </Card>
      <ModalUpdateStockWarning isShow={showUpdateStockWarning} onHide={_hideUpdateStockWarning} />
      <ModalUpdatePrice isShow={showUpdatePrice} onHide={_hideUpdatePrice} />
    </>
  );
})

export const actionKeys = {
  "product_stock_view": {
    router: '/products/stocks',
    actions: [
      "sme_product_status", 
      "sme_warehouses", 
      "sme_catalog_product_aggregate", 
      "sme_catalog_product_variant_aggregate",
      "sme_catalog_inventory_items", 
      "sme_catalog_inventory_items_aggregate", 
      "inventorySumValuActual", 
      "warehouse_reserve_ticket_items", 
      "warehouse_reserve_ticket_items_aggregate"
    ],
    name: "Xem danh sách tồn kho",
    group_code: 'product_reserve',
    group_name: 'Tồn kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_stock_detail": {    
    router: '/products/stocks/detail/:id',
    actions: [
      "sme_catalog_inventories",
      "sc_stores",
      "op_connector_channels",
      "sme_catalog_product_tags",
      "sme_warehouses"
    ],
    name: "Xem chi tiết sản phẩm phân loại",
    group_code: 'product_reserve',
    group_name: 'Tồn kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_stock_update_detail": {    
    router: '',
    actions: [
      "inventoryUpdate"
    ],
    name: "Cập nhật chi tiết sản phẩm phân loại",
    group_code: 'product_reserve',
    group_name: 'Tồn kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_stock_export": {
    router: '',
    actions: [
      "inventorySumProductExport", 
      "sme_warehouses", 
      "sme_product_status", 
      "inventoryCreateExportRequest",
      "sme_inventory_export_histories",
      "sc_stores",
      "op_connector_channels",
      "sme_catalog_product_tags"
    ],
    name: "Xuất file tồn kho - Lịch sử xuất file",
    group_code: 'product_reserve',
    group_name: 'Tồn kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_stock_warning_update": {
    router: '',
    actions: [
      "update_sme_catalog_product_variant", 
      'sme_catalog_inventories', 
      'sme_catalog_inventories_aggregate'
    ],
    name: "Cập nhật cảnh báo tồn",
    group_code: 'product_reserve',
    group_name: 'Tồn kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_stock_price_update": {
    router: '',
    actions: [
      "update_sme_catalog_product_variant_price",
      "sme_catalog_inventories"
    ],
    name: "Cập nhật giá",
    group_code: 'product_reserve',
    group_name: 'Tồn kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
  "product_stock_inventory_update": {
    router: '',
    actions: [
      "scUpdateManualProductVariantInventory",
      "sme_catalog_inventory_items"
    ],
    name: "Đẩy tồn",
    group_code: 'product_reserve',
    group_name: 'Tồn kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },   
  "product_print_barcode": {
    router: '/products/print-barcode',
    actions: [
      "userGenerateBarcodePrint",
      "userPreviewBarcodePrint", "sme_barcode_print_config",
    ],
    name: "In mã vạch",
    group_code: 'product_reserve',
    group_name: 'Tồn kho',
    cate_code: 'product_service',
    cate_name: 'Quản lý kho',
  },
};
