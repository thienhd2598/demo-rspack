import React, { Fragment, memo, useLayoutEffect, useMemo } from 'react';
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useLocation, useHistory } from 'react-router-dom';
import SVG from "react-inlinesvg";
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { TABS_TRADING_REPORT } from './TradingReportHelper';
import TradingReportOverview from './trading-report-overview';
import TradingReportChannel from './trading-report-channel';
import clsx from 'clsx';
import { useSubheader } from '../../../../_metronic/layout';

const TradingReport = () => {
    const history = useHistory();
    const location = useLocation();
    const params = queryString.parse(location.search.slice(1, 100000));
    const currentTab = params?.tab || TABS_TRADING_REPORT[0].value;

    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();

    useLayoutEffect(() => {
        setBreadcrumbs([
            { title: formatMessage({ defaultMessage: 'Báo cáo kinh doanh' }) },
        ])
    }, []);

    const viewTradingReport = useMemo(
        () => {
            const viewActive = currentTab == 'overview'
                ? <TradingReportOverview />
                : <TradingReportChannel />

            return viewActive;
        }, [currentTab]
    );

    return (
        <Fragment>
            <Helmet
                titleTemplate={formatMessage({ defaultMessage: "Báo cáo kinh doanh" }) + " - UpBase"}
                defaultTitle={formatMessage({ defaultMessage: "Báo cáo kinh doanh" }) + " - UpBase"}
            >
                <meta name="description" content={formatMessage({ defaultMessage: "Báo cáo kinh doanh" }) + " - UpBase"} />
            </Helmet>
            <Card>
                <CardBody>
                    <div className="d-flex mb-4" style={{ zIndex: 1 }}>
                        <div style={{ flex: 1 }}>
                            <ul className="nav nav-tabs">
                                {TABS_TRADING_REPORT?.map(tab => {
                                    return (
                                        <li
                                            key={`trading-report-tab-${tab.value}`}
                                            className={`nav-item`}
                                            onClick={() => history.push(`/finance/trading-report?tab=${tab.value}`)}
                                        >
                                            <a
                                                className={clsx('nav-link fs-16', currentTab === tab.value ? "active" : "")}
                                                style={{ fontWeight: 550 }}
                                            >
                                                {tab.label}
                                            </a>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                    {viewTradingReport}
                </CardBody>

                <div
                    id="kt_scrolltop1"
                    className="scrolltop"
                    style={{ bottom: 80 }}
                    onClick={() => {
                        window.scrollTo({
                            letf: 0,
                            top: document.body.scrollHeight,
                            behavior: 'smooth'
                        });
                    }}
                >
                    <span className="svg-icon">
                        <SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={' '}></SVG>
                    </span>{" "}
                </div>
            </Card>
        </Fragment>
    )
};

export default memo(TradingReport);

export const actionKeys = {
    "finance_trading_report_view": {
        router: '/finance/trading-report',
        actions: ['op_connector_channels', 'sc_stores', 'CfGetFinancePlatformDashboardTable', 'getFinanceDashboardChart', 'getFinanceDashboardTable', 'cfGetChartFinancePlatform',],
        name: 'Báo cáo kinh doanh',
        group_code: 'trading_report',
        group_name: 'Báo cáo kinh doanh',
        cate_code: 'finance_service',
        cate_name: 'Tài chính'
    },
    "finance_trading_report_export": {
        router: '/finance/trading-report',
        actions: ['cfExportFinanceReport', 'cfExportFinanceReport'],
        name: 'Xuất file báo cáo kinh doanh',
        group_code: 'trading_report',
        group_name: 'Báo cáo kinh doanh',
        cate_code: 'finance_service',
        cate_name: 'Tài chính'
    },
  };
