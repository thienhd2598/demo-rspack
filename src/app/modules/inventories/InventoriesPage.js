import React from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import InventoryChecklist from "./inventory-checklist";
import InventoryChecklistCreate from "./inventory-checklist-create";
import InventoryChecklistUpdate from "./inventory-checklist-update";
import InventoryChecklistProcessing from "./inventory-checklist-processing";
import InventoryChecklistCompleted from "./inventory-checklist-completed";
import { InventoryUIProvider } from "./InventoriesUIContext";
import { useIntl } from "react-intl";
export default function InventoriesPage({ history }) {
  const {formatMessage} = useIntl()
  const suhbeader = useSubheader();
  suhbeader.setTitle(formatMessage({defaultMessage:'Quản lý kho'}));

  const productsUIEvents = {
  };


  return (
    <InventoryUIProvider >
      <Switch>
        <ContentRoute path="/products/inventory/list" component={InventoryChecklist} roles={["product_inventory_view"]} />
        <ContentRoute path="/products/inventory/create" component={InventoryChecklistCreate} roles={["product_inventory_action", "product_inventory_view"]} />
        <ContentRoute path="/products/inventory/update/:id" component={InventoryChecklistUpdate} roles={["product_inventory_detail", "product_inventory_view"]} />
        <ContentRoute path="/products/inventory/processing/:id" component={InventoryChecklistProcessing} roles={["product_inventory_detail"]} />
        <ContentRoute path="/products/inventory/completed/:id" component={InventoryChecklistCompleted} roles={["product_inventory_detail"]} />
      </Switch>
    </InventoryUIProvider>
  );
}
