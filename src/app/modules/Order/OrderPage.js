import React, { useState } from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import OrdersList from './order-list/index';
import OrdersListHistory from './order-list-history/index';
import FailDeliveryOrder from './fail-delivery-order/index';
import OrdersListBatch from './order-list-batch/index';
import OrderDetail from './order-detail/index';
import OrderExportHistories from './order-export-history';
import ReturnOrderExportHistories from './return-order-export-history';
import FailDeliveryOrderExportHistories from './fail-delivery-export-history';
import scanOrderDelivery from "./scan-order/scan-order-delivery";
import scanOrderPacking from "./scan-order/scan-order-packing";
import { useIntl } from "react-intl";
import RefundOrder from './refund-order';
import ReturnOrder from './return-order';
import OrderProcessFailDelivery from "./order-process-fail-delivery";
import ProcessOrderReturn from './process-order-return';
import ProcessOrderReturnFail from "./process-order-return-fail";
import OrderManualCreate from "./order-manual/order-manual-create";
import OrderManualDetail from "./order-manual/order-manual-detail";
import OrderFulfillmentCreate from "./order-fulfillment/OrderFulfillmentCreate";
import OrderFulfillmentList from "./order-fulfillment/OrderFulfillmentList";
import OrderFulfillmentDetail from "./order-fulfillment/OrderFulfillmentDetail";
import OrderSessionDeliveryList from "./order-fulfillment/OrderSessionDeliveryList";
import OrderSessionDeliveryCreate from "./order-fulfillment/OrderSessionDeliveryCreate";
import OrderSessionDeliveryDetail from "./order-fulfillment/OrderSessionDeliveryDetail";
import OrderSessionReceivedCreate from "./order-fulfillment/OrderSessionReceivedCreate";
import OrderSessionReceivedDetail from "./order-fulfillment/OrderSessionReceivedDetail";
import OrderSessionHandover from "./order-fulfillment/OrderSessionHandover";

export default function OrdersPage() {
    const suhbeader = useSubheader();
    const { formatMessage } = useIntl()
    suhbeader.setTitle(formatMessage({ defaultMessage: 'Quản lý đơn hàng' }));

    return (
        <Switch>
            <ContentRoute path="/orders/list" component={OrdersList} roles={["order_list_view_reload"]} />
            <ContentRoute path="/orders/list-history" component={OrdersListHistory} roles={["order_list_history_view"]} />
            <ContentRoute path="/orders/refund-order" component={RefundOrder} roles={["refund_order_list_view"]} />
            <ContentRoute path="/orders/return-order" component={ReturnOrder} roles={["order_return_list_view"]} />
            <ContentRoute path="/orders/fail-delivery-order" component={FailDeliveryOrder} roles={["refund_order_list_view"]} />
            <ContentRoute path="/orders/fail-delivery-order-process" component={OrderProcessFailDelivery} roles={["refund_order_import_warehouse"]} />
            <ContentRoute path="/orders/list-batch" component={OrdersListBatch} roles={["order_list_batch_view"]} />
            <ContentRoute path='/orders/export-histories' component={OrderExportHistories} roles={["order_list_order_export", "order_list_history_view"]} />
            <ContentRoute path='/orders/return-export-histories' component={ReturnOrderExportHistories} roles={["order_return_list_export_order", "refund_order_export_file"]} />
            <ContentRoute path='/orders/fail-delivery-export-histories' component={FailDeliveryOrderExportHistories} roles={["refund_order_export_file"]} />
            <ContentRoute path="/orders/scan-order-packing" component={scanOrderPacking} roles={["order_scan_packing_view"]} />
            <ContentRoute path="/orders/process-return-order" component={ProcessOrderReturn} roles={["refund_order_import_warehouse"]} />
            <ContentRoute path="/orders/process-return-order-fail" component={ProcessOrderReturnFail} roles={["refund_order_import_warehouse"]} />
            <ContentRoute path="/orders/scan-order-delivery" component={scanOrderDelivery} roles={["order_scan_delivery_view"]} />
            <ContentRoute path="/orders/create-manual" component={OrderManualCreate} roles={["order_list_after_sale_order"]} />
            <ContentRoute path="/orders/fulfillment/list" component={OrderFulfillmentList} roles={["order_session_pickup_view"]} />
            <ContentRoute path="/orders/fulfillment/create" component={OrderFulfillmentCreate} roles={["order_session_pickup_create"]} />
            <ContentRoute path="/orders/fulfillment/:id" component={OrderFulfillmentDetail} roles={["order_session_pickup_actions"]} />
            <ContentRoute path="/orders/manual/:id" component={OrderManualDetail} roles={["order_detail_view", "refund_order_detail_view"]} />
            {/* <ContentRoute path="/orders/session-delivery/list" component={OrderSessionDeliveryList} roles={["order_session_handover_view"]} /> */}
            <ContentRoute path="/orders/session-delivery/create" component={OrderSessionDeliveryCreate} roles={["order_session_handover_create"]} />
            <ContentRoute path="/orders/session-delivery/:id" component={OrderSessionDeliveryDetail} roles={["order_session_handover_actions"]} />
            <ContentRoute path="/orders/session-received/create" component={OrderSessionReceivedCreate} roles={["order_session_handover_create"]} />
            <ContentRoute path="/orders/session-received/list" component={OrderSessionHandover} roles={["order_session_handover_create"]} />
            <ContentRoute path="/orders/session-received/:id" component={OrderSessionReceivedDetail} roles={["order_session_handover_create"]} />
            <ContentRoute path="/orders/:id" component={OrderDetail} roles={["order_detail_view", "refund_order_detail_view", "order_sales_person_order_detail_view"]} />
        </Switch>
    )
};