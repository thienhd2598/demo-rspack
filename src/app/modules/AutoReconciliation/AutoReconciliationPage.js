import React from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import { useIntl } from "react-intl";
import AutoReconciliation from ".";
import Details from "./auto-reconciliation-detail/Details";

export default function AutoReconciliationPage() {
    const suhbeader = useSubheader();
    const { formatMessage } = useIntl()
    suhbeader.setTitle(formatMessage({ defaultMessage: 'Đối soát dữ liệu tự động' }));

    return (
        <Switch>
            <ContentRoute path="/auto-reconciliation" exact component={AutoReconciliation} roles={["auto_reconciliation_view"]} />
            <ContentRoute path="/auto-reconciliation/:id" component={Details} roles={["auto_reconciliation_view"]} />
        </Switch>
    )
};