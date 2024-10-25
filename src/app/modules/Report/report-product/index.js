import React, { Fragment, useCallback, useState, memo, useLayoutEffect, useMemo } from "react";
import { Switch } from "react-router-dom";
import { ContentRoute, useSubheader } from "../../../../_metronic/layout";
import clsx from "clsx";
import { useIntl } from "react-intl";
import { Helmet } from "react-helmet-async";
import { useElementOnScreen } from "../../../../hooks/useElementOnScreen";
import ReportProductFilter from "./ReportProductFilter";
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import queryString from 'querystring';
import { useHistory, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { TABS_REPORT_PRODUCT } from "./ReportProductHelper";
import ReportScProduct from "./ReportScProduct";
import ReportSmeProduct from "./ReportSmeProduct";
import { useQuery } from "@apollo/client";
import query_sc_stores_basic from "../../../../graphql/query_sc_stores_basic";

const ReportProduct = () => {
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    const location = useLocation();
    const history = useHistory();
    const params = queryString.parse(location.search.slice(1, 100000));
    const [containerRef, isVisible] = useElementOnScreen({
        root: null,
        rootMargin: "0px",
        threshold: 1.0
    });

    const { data: dataStore, loading: loadingStore } = useQuery(query_sc_stores_basic, {
        variables: {
            context: 'order'
        },
        fetchPolicy: 'cache-and-network'
    });

    useLayoutEffect(() => {
        setBreadcrumbs([
            {
                title: formatMessage({ defaultMessage: 'Sản phẩm' }),
            },
        ])
    }, []);

    const store_id = useMemo(
        () => {
            try {
                let store = params?.store || null
                if (!store) {
                    return {}
                }
                return { store_ids: store }
            } catch (error) {
                return {}
            }
        }, [params.store]
    );


    const channel_code = useMemo(
        () => {
            try {
                let channel = params?.channel || null;
                if (!channel) {
                    return {}
                }
                return { channel_codes: channel }
            } catch (error) {
                return {}
            }
        }, [params.channel]
    );

    const from = useMemo(
        () => {
            try {
                let from = params?.from || dayjs().subtract(7, "day").unix();
                return { from: Number(from) }
            } catch (error) {
                return {}
            }
        }, [params.from]
    );

    const to = useMemo(
        () => {
            try {
                let to = params?.to || dayjs().subtract(1, "day").unix();
                return { to: Number(to) }
            } catch (error) {
                return {}
            }
        }, [params.to]
    );

    const date = useMemo(
        () => {
            try {
                let date = params?.date || dayjs().subtract(1, "day").unix();
                return { date: Number(date) }
            } catch (error) {
                return {}
            }
        }, [params.date]
    );

    const tabActive = useMemo(() => {
        if (!params?.tab) return TABS_REPORT_PRODUCT[0].id

        return params?.tab
    }, [params?.tab]);

    const variables = useMemo(() => {
        return {
            ...channel_code,
            ...store_id,
            ...(tabActive == 1 ? {
                ...from,
                ...to
            } : {
                ...date
            })
        }
    }, [channel_code, store_id, from, to, tabActive, date]);


    return (
        <Fragment>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Phân tích sản phẩm' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Phân tích sản phẩm' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Phân tích' })} - UpBase`} />
            </Helmet>
            <div className="row">
                <ul className="nav nav-tabs-line mb-5 fs-6">
                    {TABS_REPORT_PRODUCT.map(tab => (
                        <li
                            key={`report-product-tab-${tab.id}`}
                            className="nav-item"
                            onClick={(e) => {
                                e.preventDefault();
                                history.push(`/report/product?tab=${tab.id}`);
                            }}
                        >
                            <a
                                className={clsx('nav-link fs-14', { active: tab.id == tabActive })}
                                data-bs-toggle="tab"
                                href=""
                            >
                                {tab.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            <div ref={containerRef} />
            <ReportProductFilter
                visible={isVisible}
                tabActive={tabActive}
                dataStore={dataStore}
                loadingStore={loadingStore}
            />
            <ReportScProduct
                tabActive={tabActive}
                variables={variables}
                dataStore={dataStore}
            />
            <ReportSmeProduct
                tabActive={tabActive}
                variables={variables}
                dataStore={dataStore}
            />
        </Fragment>
    )
};

export default memo(ReportProduct);

