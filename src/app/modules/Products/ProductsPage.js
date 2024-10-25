import React, { useState } from "react";
import { Switch } from "react-router-dom";
import { ProductEdit } from "./product-edit/ProductEdit";
import { ProductsUIProvider } from "./ProductsUIContext";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import { ProductNew } from "./product-new/ProductNew";
import ProductAffiliate from "./product-affiliate/ProductAffiliate";
import ProductsList from "./products-list";
import ProductsStocks from "./products-stocks";
import ProductsSyncs from "./products-syncs";
import productCreateMultiOnstores from "./product-create-multi-onstores";
import ProductUpdateTagImage from "./product-update/ProductUpdateTagOriginImage";
import ProductUpdateSellInfo from "./product-update/ProductUpdateSellInfo";
import ProductUpdateImage from "./product-update/ProductUpdateImage";
import productsStocksDetail from "./products-stocks-detail";
import { ProductNewCombo } from "./product-new-combo/ProductNewCombo";
import { ProductEditCombo } from "./product-edit-combo/ProductEditCombo";
import InventoryExportHistory from './inventory-export-history'
import ExpiredInventoryExportHistory from './expired-inventory-export-history'
import { useIntl } from "react-intl";
import HistoryExportTabGoods from "./history-export-tab-goods";
import WarehouseList from "../WarehouseBills/WarehouseList";
import ProductPrintBarcode from "./product-print-barcode";
import ProductReserveList from "./products-reserve/product-reserve-list";
import ProductReserveCreate from "./products-reserve/product-reserve-create";
import ProductReserveDetail from "./products-reserve/product-reserve-detail";
import ProductUpdatePriceVat from "./product-update-price-vat";
import ExpirationManage from "./expiration-manage";
import ProductUpdateNameCategory from "./product-update-category";

export default function ProductsPage({ history }) {
  const { formatMessage } = useIntl()
  const suhbeader = useSubheader();
  suhbeader.setTitle(formatMessage({defaultMessage:'Quản lý kho'}));

  const productsUIEvents = {
  };


  return (
    <ProductsUIProvider productsUIEvents={productsUIEvents}>
      <Switch>
        <ContentRoute path="/products/list" component={ProductsList} roles={["product_list_view"]} />
        <ContentRoute path="/products/warehouselist" component={WarehouseList} roles={["warehouse_view"]} />
        <ContentRoute path="/products/stocks/detail/:id" component={productsStocksDetail} roles={["product_stock_detail"]} />
        <ContentRoute path="/products/stocks" component={ProductsStocks} roles={["product_stock_view"]} />
        <ContentRoute path="/products/print-barcode" component={ProductPrintBarcode} roles={["product_print_barcode"]} />
        <ContentRoute path="/products/create-onstore" component={productCreateMultiOnstores} roles={["product_create_store_product"]} />
        <ContentRoute path="/products/new" component={ProductNew} roles={["product_new"]} />
        <ContentRoute path="/products/reserve/:id" component={ProductReserveDetail} roles={["product_reserve_detail"]} />
        <ContentRoute path="/products/reserve" component={ProductReserveList} roles={["product_reserve_view"]} />
        <ContentRoute path="/products/reserve-create" component={ProductReserveCreate} roles={["product_reserve_action"]} />
        <ContentRoute path="/products/new-combo" component={ProductNewCombo} roles={["product_new"]} />
        <ContentRoute path="/products/update-price-vat" component={ProductUpdatePriceVat} roles={["product_action"]} />
        <ContentRoute path="/products/update-category" component={ProductUpdateNameCategory} roles={["product_action"]} />
        <ContentRoute path="/products/update-tag-origin-image" component={ProductUpdateTagImage} roles={["product_action"]} />
        <ContentRoute path="/products/update-image" component={ProductUpdateImage} roles={["product_action"]} />
        <ContentRoute path="/products/update-sell-info" component={ProductUpdateSellInfo} roles={["product_action"]} />
        <ContentRoute path="/products/edit/:id" component={ProductEdit} roles={["product_detail"]} />
        <ContentRoute path="/products/edit-combo/:id" component={ProductEditCombo} roles={["product_detail"]} />
        <ContentRoute path="/products/edit/:id/affiliate" component={ProductAffiliate} roles={["product_detail"]} />
        <ContentRoute path="/products/inventory-export-history" component={InventoryExportHistory} roles={["product_stock_view"]} />
        <ContentRoute path="/products/expired-inventory-export-history" component={ExpiredInventoryExportHistory} roles={["warehouse_expire"]}/>
        <ContentRoute path="/products/history-export-tab-goods" component={HistoryExportTabGoods} roles={["warehouse_bill_history_export"]} />
        <ContentRoute path="/products/expiration-manage" component={ExpirationManage} roles={["warehouse_expire"]} />
      </Switch>
    </ProductsUIProvider>
  );
}
