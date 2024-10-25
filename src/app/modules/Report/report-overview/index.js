import React, { memo, useMemo, Fragment, useState, useLayoutEffect } from 'react';
import queryString from 'querystring';
import { useSubheader } from "../../../../_metronic/layout";
import { useLocation } from "react-router-dom";
import dayjs from 'dayjs';
import _ from 'lodash';
import ReportLineChart from './component/ReportLineChart';
import ReportPieChart from './component/ReportPieChart';
import ReportProduct from './component/ReportProduct';
import ReportFilterChart from './component/ReportFilterChart';
import { useElementOnScreen } from '../../../../hooks/useElementOnScreen';
import { toAbsoluteUrl } from "../../../../_metronic/_helpers";
import '../components/calendar/Calendar.css';
import { Helmet } from 'react-helmet-async';
import SVG from "react-inlinesvg";
import { useIntl } from 'react-intl';

export default memo(() => {
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
                    title: formatMessage({ defaultMessage: 'Tổng quan' }),
                },                
            ])
        }, []
    );

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
                let from = params?.from || dayjs().startOf('day').unix()
                return { from: parseInt(from) }
            } catch (error) {
                return {}
            }
        }, [params.from]
    );

    const to = useMemo(
        () => {
            try {
                let to = params?.to || dayjs().startOf('hour').unix()
                return { to: parseInt(to) }
            } catch (error) {
                return {}
            }
        }, [params.to]
    );

    const status = useMemo(
        () => {
            try {
                return {
                    status: params?.status ? Number(params?.status) : 0
                }
            } catch (error) {
                return {}
            }
        }, [params?.status]
    )

    let variables = useMemo(
        () => {
            return {
                ...store_id,
                ...channel_code,
                ...status,
                ...from,
                ...to,
                last_type: params?.type_filter || 'today'
            }
        }, [store_id, channel_code, from, to, status, params?.type_filter]
    );
    

    return (
        <Fragment>
            <Helmet
                titleTemplate={`${formatMessage({ defaultMessage: 'Phân tích tổng quan' })} - UpBase`}
                defaultTitle={`${formatMessage({ defaultMessage: 'Phân tích tổng quan' })} - UpBase`}
            >
                <meta name="description" content={`${formatMessage({ defaultMessage: 'Phân tích tổng quan' })} - UpBase`} />
            </Helmet>
            <div ref={containerRef}></div>
            <ReportFilterChart visible={isVisible} variables={variables} />
            <ReportLineChart variables={variables} />
            <ReportPieChart variables={variables} />
            <ReportProduct variables={variables} />
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
        </Fragment>
    )
})

export const actionKeys = {
    "report": {
        router: '',
        actions: [
            "op_connector_channels", 
            "sc_stores", 
            "report_charts", 
            "report_bars", 
            "report_productSoldScByGMV", 
            "report_productSoldScByQuantity", 
            "report_productSoldSmeByGMV", 
            "report_productSoldSmeByQuantity", 
            "scGetProductVariantAssets", 
            "scGetProductVariants", 
            "sme_catalog_product_variant_by_pk",
            "cfGetAnalysisFinancePlatformTable", 
            "cfGetAnalysisFinancePlatformChart",
            "cfExportAnalysisFinancePlatform",
            "cfGetAnalysisFinanceChart", 
            "cfGetAnalysisFinanceTable",
            "cfExportAnalysisFinanceOverview",
            "report_scproduct_improve_cancel_ratio_pagination", 
            "report_scproduct_improve_cancel_ratio", 
            "report_scproduct_improve_GMV_pagination", 
            "report_scproduct_improve_GMV",
            "report_scproductGMV",
            "report_scproductQuantity", 
            "report_smeproductGMV", 
            "report_smeproductQuantity",
            "report_smeproduct_improve_cancel_ratio_pagination", 
            "report_smeproduct_improve_cancel_ratio", 
            "report_smeproduct_improve_GMV_pagination", 
            "report_smeproduct_improve_GMV",
            "report_customers", 
            "report_customer_area",
            "report_scproductGMV_v2", 
            "report_scproductQuantity_v2", 
            "report_smeproductQuantity_v2", 
            "report_smeproductGMV_v2",
            "report_scproductChart", 
            "report_smeproductChart", 
            "sme_warehouses",
            "report_chartsExport"
        ],
        name: "Phân tích",
        group_code: 'report',
        group_name: 'Phân tích',
        cate_code: 'report',
        cate_name: 'Phân tích',
    }
};
