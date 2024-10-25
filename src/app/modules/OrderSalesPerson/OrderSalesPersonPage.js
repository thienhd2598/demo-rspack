import React, { useState } from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import { useIntl } from "react-intl";
import OrderSalesPersonList from './order-sales-person-list/index'
import ApprovedManualOrder from './approved-manual-order'
import HistoryExportFileApprovedOrder from './history-export-file-approved-order'
import HistoryExportFileSalesPersonOrder from './history-export-file-sales-person-order'
import OrderManualCreate from '../Order/order-manual/order-manual-create'
import OrderManualDetail from '../Order/order-manual/order-manual-detail'
import OrderPos from "./order-pos";
 

export default function OrdersPage() {
    const suhbeader = useSubheader();
    const {formatMessage} = useIntl()
    suhbeader.setTitle(formatMessage({defaultMessage: 'Quản lý đơn hàng - NVBH'}));

    return (
        <Switch>
            <ContentRoute path="/order-sales-person/list-order" component={OrderSalesPersonList} roles={["order_sales_person_list_view"]} />
            <ContentRoute path="/order-sales-person/history-export-file-approved-order" component={HistoryExportFileApprovedOrder} roles={["order_sales_person_export_file"]} />
            <ContentRoute path="/order-sales-person/history-export-file-sales-person-order" component={HistoryExportFileSalesPersonOrder} roles={["order_sales_person_export_file"]} />
            <ContentRoute path="/order-sales-person/approved-order" component={ApprovedManualOrder} roles={["order_approved"]} />
            <ContentRoute path="/order-sales-person/create-manual" component={OrderManualCreate} roles={["order_sales_person_create_manual"]} />
            <ContentRoute path="/order-sales-person/create-pos" component={OrderPos} roles={["order_pos"]} />
            <ContentRoute path="/order-sales-person/manual/:id" component={OrderManualDetail} roles={["order_sales_person_order_detail_view"]} />
        </Switch>
    )
};