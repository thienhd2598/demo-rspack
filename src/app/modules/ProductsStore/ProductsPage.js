import React, { useEffect, useState } from "react";
import { Switch } from "react-router-dom";
import { ProductEdit } from "./product-edit/ProductEdit";
import { ProductsUIProvider } from "./ProductsUIContext";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import { ProductNew } from "./product-new/ProductNew";
import ProductsList from "./products-list";
import ProductsListDraf from "./products-list-draf";
import ProductsSync from "./products-syncs";
import ProductListStockTracking from "./products-list-stock-tracking";
import ProductUpdateTagImageDraf from "./product-update-draf/ProductUpdateTagOriginImage";
import ProductUpdateTagImage from "./product-update/ProductUpdateTagOriginImage";
import ProductUpdateSellInfo from "./product-update/ProductUpdateSellInfo";
import ProductUpdateImage from "./product-update/ProductUpdateImage";
import ProductConnectList from "./product-connect-list/index";
import ProductCreateMultiple from "./product-create-multiple";
import ProductCreateOnly from "./product-create-multiple/ProductCreateOnly";
import { useIntl } from "react-intl";

export default function ProductsPage({ history }) {
  const { formatMessage } = useIntl();
  const suhbeader = useSubheader();
  const [confirmOpen, setConfirmOpen] = useState(true);
  suhbeader.setTitle(formatMessage({ defaultMessage: 'Quản lý sản phẩm sàn' }));  
  
  const productsUIEvents = {
  };


  return (
    <ProductsUIProvider productsUIEvents={productsUIEvents}>
      <Switch>
        <ContentRoute path="/product-stores/list" component={ProductsList} roles={["product_store_view"]} />
        <ContentRoute path="/product-stores/draf" component={ProductsListDraf} roles={["product_store_list_draft_view"]} />
        <ContentRoute path="/product-stores/new" component={ProductNew} roles={["product_store_create"]} />
        <ContentRoute path="/product-stores/multiple" component={ProductCreateMultiple} roles={["product_store_create_sme_product"]} />
        <ContentRoute path="/product-stores/single" component={ProductCreateOnly} roles={["product_store_create_sme_product"]} />
        <ContentRoute path="/product-stores/update-tag-origin-image-draf" component={ProductUpdateTagImageDraf} roles={["product_store_list_draft_action"]} />
        <ContentRoute path="/product-stores/update-tag-origin-image" component={ProductUpdateTagImage} roles={["product_store_action"]} />
        <ContentRoute path="/product-stores/update-images" component={ProductUpdateImage} roles={["product_store_action"]} />
        <ContentRoute path="/product-stores/update-sell-info" component={ProductUpdateSellInfo} roles={["product_store_action"]} />
        <ContentRoute path="/product-stores/edit/:id" component={ProductEdit} roles={["product_store_detail","product_store_draft_detail"]} />
        <ContentRoute path="/product-stores/connect" component={ProductConnectList} roles={["product_store_connect_view"]} />
        <ContentRoute path="/product-stores/syncs" component={ProductsSync} roles={["product_store_sync_view"]} />
        <ContentRoute path="/product-stores/list-stock-tracking" component={ProductListStockTracking} roles={["product_store_stock_view"]} />
      </Switch>
    </ProductsUIProvider>
  );
}
