import React, { Fragment, memo, useLayoutEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useIntl } from "react-intl";
import ReportUserFilter from "./ReportUserFilter";
import ReportUserSell from "./ReportUserSell";
import ReportUserDistribution from "./ReportUserDistribution";
import { useQuery } from "@apollo/client";
import query_report_customers from "../../../../graphql/query_report_customers";
import query_report_customer_area from "../../../../graphql/query_report_customer_area";
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'querystring';
import dayjs from "dayjs";
import { useElementOnScreen } from "../../../../hooks/useElementOnScreen";
import { useSubheader } from "../../../../_metronic/layout";

const ReportUser = () => {
    const { formatMessage } = useIntl();
    const { setBreadcrumbs } = useSubheader();
    const params = queryString.parse(useLocation().search.slice(1, 100000));
    const [containerRef, isVisible] = useElementOnScreen({
        root: null,
        rootMargin: "0px",
        threshold: 1.0
    });

    useLayoutEffect(
        () => {
            setBreadcrumbs([
                {
                    title: formatMessage({ defaultMessage: 'Người mua' }),
                },
            ])
        }, []
    );

    const channel_code = useMemo(
        () => {
            try {
                let channel = params?.channel || null;
                if (!channel) {
                    return {}
                }
                return { channel_code: channel }
            } catch (error) {
                return {}
            }
        }, [params.channel]
    );

    const from = useMemo(
        () => {
            try {
                let from = params?.from || dayjs().add(-1, 'day').startOf('day').unix()
                return { from: parseInt(from) }
            } catch (error) {
                return {}
            }
        }, [params.from]
    );

    const variables = useMemo(
        () => {
            return {
                type: params?.type_filter || 'day',
                ...from,
                ...channel_code,
            }
        }, [params?.type_filter, from, channel_code]
    );

    const { data: dataReportCustomers, loading: loadingReportCustomer } = useQuery(query_report_customers, {
        variables,
        fetchPolicy: 'cache-and-network'
    });

    const { data: dataReportBars, loading: loadingReportBars } = useQuery(query_report_customer_area, {
        variables: {
            ...variables,
            page: 1,
            pageSize: 64
        },
        fetchPolicy: 'cache-and-network'
    });

    console.log({ dataReportBars, dataReportCustomers })

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Phân tích người mua' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Phân tích người mua' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Phân tích' })} - UpBase`} />
            </Helmet>
            <div ref={containerRef}></div>
            <ReportUserFilter visible={isVisible} />
            <ReportUserSell
                dataReportCustomers={dataReportCustomers}
                loadingReportCustomer={loadingReportCustomer}
            />
            <ReportUserDistribution
                variables={variables}
                dataReportBars={dataReportBars}
                loadingReportBars={loadingReportBars}
            />
        </Fragment>
    )
};

export default memo(ReportUser);
