import React from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import PaymentReconciliation from './payment-reconciliation';
import HistoryExportFileSettlementPending from "./history-exportfile-settlement-pending";
import HistoryExportFileSettlementProcessed from "./history-exportfile-settlement-processed";
import HistoryExportFileFinanceOrder from "./history-exportfile-finance-order";
import ManageFinanceOrders from './manage-finance-orders'
import { useIntl } from "react-intl";
import TradingReport from "./trading-report";
import Cost from "./cost";
import DetailFinanceOrder from "./detail-finance-order";
import ManagerCostPrice from "./manager-cost-price";
import ProductUpdatePriceVat from "./manager-cost-price/product-update-price-vat";

export default function FinancePage() {
    const suhbeader = useSubheader();
    const { formatMessage } = useIntl()
    suhbeader.setTitle(formatMessage({ defaultMessage: 'Tài chính' }));

    return (
        <Switch>
            <ContentRoute path="/finance/payment-reconciliation" component={PaymentReconciliation} roles={["finance_settlement_order_view"]} />
            <ContentRoute path="/finance/exportfile-settlement-pending" component={HistoryExportFileSettlementPending} roles={["finance_order_manage_export", "finance_settlement_order_export"]} />
            <ContentRoute path="/finance/exportfile-settlement-processed" component={HistoryExportFileSettlementProcessed} roles={["finance_order_manage_export", "finance_settlement_order_export"]} />
            <ContentRoute path="/finance/exportfile-finance-order" component={HistoryExportFileFinanceOrder} roles={["finance_order_manage_view", "finance_settlement_order_export", "finance_order_manage_export"]} />
            <ContentRoute path="/finance/manage-finance-order" component={ManageFinanceOrders} roles={["finance_order_manage_view"]} />
            <ContentRoute path="/finance/cost" component={Cost} roles={["finance_cost_period_view"]} />
            <ContentRoute path="/finance/trading-report" component={TradingReport} roles={["finance_trading_report_view"]} />
            <ContentRoute path="/finance/manage-cost-price" component={ManagerCostPrice} roles={["finance_cost_price_manage_view"]} />
            <ContentRoute path="/finance/update-cost-price-vat" component={ProductUpdatePriceVat} roles={["finance_update_price_vat"]} />
            <ContentRoute path="/finance/:id" component={DetailFinanceOrder} roles={["finance_detail_order_view"]} />
        </Switch>
    )
};