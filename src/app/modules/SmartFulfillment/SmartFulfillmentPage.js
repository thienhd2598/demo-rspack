import React from "react";
import { useIntl } from "react-intl";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import PickupGoodsList from "./PickupGoods/PickupGoodsList";
import PickupGoodsCreate from "./PickupGoods/PickupGoodsCreate";

export default function SmartFulfillmentPage() {
    const suhbeader = useSubheader();
    const { formatMessage } = useIntl()
    suhbeader.setTitle(formatMessage({ defaultMessage: 'Smart FFM' }));

    return (
        <Switch>
            <ContentRoute path="/smart-ffm/pickup-goods/list" component={PickupGoodsList} roles={[]} />
            <ContentRoute path="/smart-ffm/pickup-goods/create" component={PickupGoodsCreate} roles={[]} />
        </Switch>
    )
};
