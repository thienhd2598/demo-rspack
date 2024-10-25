import React from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import { WarehouseBillsUIProvider } from "./WarehouseBillsUIContext";
import WarehouseBillList from "./WarehouseBillList";
import WarehouseBillCreate from "./WarehouseBillCreate";
import WarehouseBillOut from "./WarehouseBillOut";
import WarehouseBillHistory from "./WarehouseBillHistory";
import WarehouseBillIn from "./WarehouseBillIn";
import WarehouseProductCategories from "./WarehouseProductCategories";
import { useIntl } from 'react-intl';

export default function WarehouseBillPage({ history }) {
  const { formatMessage } = useIntl();
  const suhbeader = useSubheader();
  suhbeader.setTitle(formatMessage({ defaultMessage: 'Quản lý kho' }));

  const productsUIEvents = {
  };  

  return (
    <WarehouseBillsUIProvider >
      <Switch>
        <ContentRoute path="/products/warehouse-bill/list" component={WarehouseBillList} roles={["warehouse_bill_view"]} />
        <ContentRoute path="/products/warehouse-bill/create" component={WarehouseBillCreate} roles={["warehouse_bill_out_action", "warehouse_bill_in_create"]} />
        <ContentRoute path="/products/warehouse-bill/in/:id" component={WarehouseBillIn} roles={["warehouse_bill_view"]} />
        <ContentRoute path="/products/warehouse-bill/out/:id" component={WarehouseBillOut} roles={["warehouse_bill_view"]} />
        <ContentRoute path="/products/warehouse-bill/history" component={WarehouseBillHistory} roles={["warehouse_bill_history_view"]} />
        <ContentRoute path="/products/warehouse-bill/product-categories" component={WarehouseProductCategories} roles={["warehouse_category_view"]} />
      </Switch>
    </WarehouseBillsUIProvider>
  );
}
