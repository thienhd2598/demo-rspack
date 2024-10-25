import React, { useState } from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import { useIntl } from "react-intl";
import SaleList from './sale-list'
import SaleDetail from "./sale-detail";
import CampaignCreateList from './campaign-create'
import CampaignCreate from './campaign-create/CamPaignCreate'
import CampaignTemplateStep1 from "./campaign-template-create/CampaignTemplateStep1";
import CamPaignCreateTemplate from "./campaign-template-create";
import CamPaignEditTemplate from "./campaign-template-edit";
import VoucherCreate from "./voucher-create";
import VoucherEdit from "./voucher-edit";
import VoucherCreateTemplate from "./voucher-create-template";
import VoucherEditTemplate from "./voucher-edit-template";
import DealCreate from "./deal-create";
import DealEdit from "./deal-edit";
import DealCreateTemplate from "./deal-create-template";
import DealEditTemplate from "./deal-edit-template";

export default function OrdersPage() {
    const suhbeader = useSubheader();
    const {formatMessage} = useIntl()
    suhbeader.setTitle(formatMessage({defaultMessage: 'Quản lý marketing'}));

    return (
        <Switch>
            <ContentRoute path="/marketing/sale-list" component={SaleList} roles={["marketing_list_view"]} />
            <ContentRoute path="/marketing/sale/:id" component={SaleDetail} roles={["marketing_list_update", "marketing_list_approved", "marketing_list_view"]} />
            <ContentRoute path="/marketing/campaign-create" component={CampaignCreateList} roles={["marketing_list_update"]} />
            <ContentRoute path="/marketing/campaign-create-new" component={CampaignCreate} roles={["marketing_list_update"]} />
            <ContentRoute path="/marketing/campaign-template-create" component={CampaignTemplateStep1} roles={["marketing_list_update"]} />
            <ContentRoute path="/marketing/campaign-template/:id" component={CamPaignEditTemplate} roles={["marketing_list_update", "marketing_list_approved", "marketing_list_view"]} />
            <ContentRoute path="/marketing/campaign-template-create-new" component={CamPaignCreateTemplate} roles={["marketing_list_update"]} />
            <ContentRoute path="/marketing/voucher-create" component={VoucherCreate} roles={["marketing_list_update"]} />
            <ContentRoute path="/marketing/voucher-template-create" component={VoucherCreateTemplate} roles={["marketing_list_update"]} />
            <ContentRoute path="/marketing/voucher/:id" component={VoucherEdit} roles={["marketing_list_update", "marketing_list_approved", "marketing_list_view"]} />
            <ContentRoute path="/marketing/voucher-template/:id" component={VoucherEditTemplate} roles={["marketing_list_update", "marketing_list_approved", "marketing_list_view"]} />
            <ContentRoute path="/marketing/deal-create" component={DealCreate} roles={["marketing_list_update"]} />
            <ContentRoute path="/marketing/deal/:id" component={DealEdit} roles={["marketing_list_update", "marketing_list_approved", "marketing_list_view"]} />
            <ContentRoute path="/marketing/deal-template-create" component={DealCreateTemplate} roles={["marketing_list_update"]} />
            <ContentRoute path="/marketing/deal-template/:id" component={DealEditTemplate} roles={["marketing_list_update", "marketing_list_approved", "marketing_list_view"]} />
        </Switch>
    )
};
