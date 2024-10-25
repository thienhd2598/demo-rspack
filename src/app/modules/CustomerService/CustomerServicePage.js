import React from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import ManageRating from './manage-rating'
import AutoReplyRating from "./auto-reply-rating";
import CustomerInfoList from "./customer-info/CustomerInfoList";
import { useIntl } from "react-intl";
import CustomerInfoDetail from "./customer-info/CustomerInfoDetail";
import CustomerExportHistory from "./customer-info/CustomerExportHistory";

export default function OrdersPage() {
    const suhbeader = useSubheader();
    const { formatMessage } = useIntl()
    suhbeader.setTitle(formatMessage({ defaultMessage: 'Chăm sóc khách hàng' }));

    return (
        <Switch>
            <ContentRoute path="/customer-service/manage-rating" component={ManageRating} roles={["customer_service_rating_view"]} />
            <ContentRoute path="/customer-service/auto-reply-rating" component={AutoReplyRating} roles={["customer_service_auto_reply_rating_setting"]} />
            <ContentRoute path="/customer-service/customer-info/:id" component={CustomerInfoDetail} roles={["customer_service_customer_info_update", "customer_service_customer_info_view"]} />
            <ContentRoute path="/customer-service/customer-info" component={CustomerInfoList} roles={["customer_service_customer_info_view"]} />
            <ContentRoute path="/customer-service/export-histories" component={CustomerExportHistory} roles={["customer_service_customer_info_export"]} />
        </Switch>
    )
};