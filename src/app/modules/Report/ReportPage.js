import React, { Fragment, useCallback, useState } from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../_metronic/layout";
import ReportOverview from "./report-overview";
import ReportUser from "./report-user";
import { TABS_REPORT } from "./ReportUIHelper";
import { useHistory } from 'react-router-dom';
import clsx from "clsx";
import ReportProduct from "./report-product";
import ReportSell from "./report-sell";
import ReportOrder from "./report-order";
import ReportEffectiveBusiness from "./report-effective-business";
import ReportProductDetail from "./report-product-detail";

export default function ReportPage() {
    const suhbeader = useSubheader();
    const history = useHistory();
    suhbeader.setTitle('Phân tích');

    return (
        <Fragment>
            <ul className="nav nav-tabs-custom nav-tabs-line mb-5 fs-6">
                {TABS_REPORT.map(tab => (
                    <li
                        className="nav-item"
                        key={`report-tab-${tab.id}`}
                        onClick={(e) => {
                            e.preventDefault();
                            history.push(tab.route);
                        }}
                    >
                        <a
                            className={clsx('nav-link', { active: history?.location?.pathname.includes(tab.route)})}
                            data-bs-toggle="tab"
                            href=""
                        >
                            {tab.tittle}
                        </a>
                    </li>
                ))}
            </ul>
            <Switch>
                <ContentRoute path="/report/overview" component={ReportOverview} roles={['report']} />
                <ContentRoute path="/report/product/:id" component={ReportProductDetail} roles={['report']} />
                <ContentRoute path="/report/product" component={ReportProduct} roles={['report']} />
                <ContentRoute path="/report/sell" component={ReportSell} roles={['report']} />
                <ContentRoute path="/report/user" component={ReportUser} roles={['report']} />                
                <ContentRoute path="/report/order" component={ReportOrder} roles={['report']} />                
                <ContentRoute path="/report/effective-business" component={ReportEffectiveBusiness} roles={['report']} />
            </Switch>
        </Fragment>
    )
};