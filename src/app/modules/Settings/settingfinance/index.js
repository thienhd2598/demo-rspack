import React, { useLayoutEffect, useMemo, useState } from 'react'
import { useSubheader } from '../../../../_metronic/layout';
import { useIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import { useHistory, useLocation } from "react-router-dom";
import queryString from 'querystring';
import SVG from "react-inlinesvg";
import { toAbsoluteUrl } from '../../../../_metronic/_helpers';
import { useToasts } from 'react-toast-notifications'
import { Card, CardBody } from "../../../../_metronic/_partials/controls";
import SettingExportBill from './SettingExportBill';
import query_getInvoiceSetting from '../../../../graphql/query_getInvoiceSetting'
import query_getFinanceOrderSetting from '../../../../graphql/query_getFinanceOrderSetting'
import { useQuery } from '@apollo/client';
import { tabs } from './constant'
import SettingOrderFinance from './SettingOrderFinance';
import { shallowEqual, useSelector } from 'react-redux';
import SettingTradingReport from './SettingTradingReport';
import SettingVAT from './SettingVAT';
const SettingFinance = () => {
    const { setBreadcrumbs } = useSubheader();
    const { addToast } = useToasts()
    const { formatMessage } = useIntl()
    const location = useLocation();
    const history = useHistory()
    const params = queryString.parse(location.search.slice(1, 100000))

    const { data, loading, refetch, error } = useQuery(query_getInvoiceSetting, {
        fetchPolicy: 'cache-and-network',
        skip: params?.tab !== 'settingexportbill'
    });

    const { data: dataFinanceOrderSetting, loading: loadingGetFinanceOrder, refetch: refetchGetFinanceOrder, error: errorGetFinanceOrder } = useQuery(query_getFinanceOrderSetting, {
        fetchPolicy: 'cache-and-network',
        skip: params?.tab == 'settingexportbill'
    });

    useLayoutEffect(() => {
        setBreadcrumbs([{ title: formatMessage({ defaultMessage: "Cài đặt" }) }, { title: formatMessage({ defaultMessage: "Cài đặt tài chính" }) }]);
    }, []);


    return (
        <>
            <Helmet titleTemplate={formatMessage({ defaultMessage: `Cài đặt tài chính {key}` }, { key: " - UpBase" })} defaultTitle={formatMessage({ defaultMessage: `Cài đặt tài chính {key}` }, { key: " - UpBase" })}>
                <meta name="description" content={formatMessage({ defaultMessage: `Cài đặt tài chính {key}` }, { key: " - UpBase" })} />
            </Helmet>
            <Card>
                <div className="d-flex w-100 mt-2" style={{ background: "#fff", zIndex: 1, borderBottom: 'none' }}>
                    <div style={{ flex: 1 }}>
                        <ul className="nav nav-tabs" id="myTab" role="tablist">
                            {tabs.map((_tab, index) => {
                                const { title, key } = _tab;
                                const isActive = key == (params?.tab || "setingfinance");
                                return (
                                    <>
                                        <li style={{ cursor: 'pointer' }}
                                            key={`tab-order-${index}`}
                                            className={`nav-item ${isActive ? "active" : ""}`}>
                                            <span className={`nav-link font-weight-normal ${isActive ? "active" : ""}`}
                                                style={{ fontSize: "13px" }}
                                                onClick={() => {
                                                    history.push(`${location.pathname}?${queryString.stringify({ tab: key })}`);
                                                }}
                                            >
                                                {formatMessage(title)}
                                            </span>
                                        </li>
                                    </>
                                );
                            })}
                        </ul>
                    </div>
                </div>
                <CardBody>
                    {(loading || loadingGetFinanceOrder) && <div className='text-center col-6 mt-4' style={{ position: 'absolute' }} ><span className="spinner spinner-primary"></span></div>}
                    {/* {((!!error && !loading) || (!!errorGetFinanceOrder && !loadingGetFinanceOrder)) && (
                        <div className="col-6 text-center mt-8" style={{ position: 'absolute', zIndex: 101 }} >
                            <div className="d-flex flex-column justify-content-center align-items-center">
                                <i className='far fa-times-circle text-danger' style={{ fontSize: 48, marginBottom: 8 }}></i>
                                <p className="mb-6">{formatMessage({ defaultMessage: 'Xảy ra lỗi trong quá trình tải dữ liệu' })}</p>
                                <button className="btn btn-primary btn-elevate" style={{ width: 100 }}
                                    onClick={e => {
                                        e.preventDefault();
                                        params?.tab == 'settingexportbill' ? refetch() : refetchGetFinanceOrder()
                                    }}>
                                    {formatMessage({ defaultMessage: 'Tải lại' })}
                                </button>
                            </div>
                        </div>
                    )}                     */}
                    {params?.tab == 'settingexportbill' && <SettingExportBill loadingInvoiceSetting={loading} dataInvoiceSetting={data?.getInvoiceSetting} />}
                    {(!params?.tab || params?.tab == 'setingfinance') && <SettingOrderFinance dataFinanceOrderSetting={dataFinanceOrderSetting} loadingGetFinanceOrder={loadingGetFinanceOrder} />}
                    {params?.tab == 'settingTradingReport' && <SettingTradingReport />}
                    {params?.tab == 'settingVAT' && <SettingVAT />}
                </CardBody>
            </Card>

            <div id="kt_scrolltop1"
                className="scrolltop"
                style={{ bottom: 80 }}
                onClick={() => { window.scrollTo({ letf: 0, top: document.body.scrollHeight, behavior: "smooth" }); }}>
                <span className="svg-icon"><SVG src={toAbsoluteUrl("/media/svg/icons/Navigation/Down-2.svg")} title={" "}></SVG>
                </span>
            </div>
        </>
    )
}

export default SettingFinance

export const actionKeys = {
    "setting_finance_view": {
        router: '/setting/setting-finance',
        actions: [
            "getInvoiceSetting",
            "getFinanceOrderSetting",
            "prvListProviderConnected",
            "cfGetListSettingPercentFee",
            "sc_stores",
            "op_connector_channels",
            "cfGetListSettingPercentVat", 
            "getCostPeriodType"
        ],
        name: 'Cài đặt tài chính',
        group_code: 'setting_finance',
        group_name: 'Cài đặt tài chính',
        cate_code: 'setting_service',
        cate_name: 'Cài đặt',
    },
    "setting_finance_action": {
        router: '/setting/setting-finance',
        actions: [
            "getInvoiceSetting",
            "loginInvoicePartner",
            "configInvoiceSetting",
            "disconnectInvoicePartner",
            "saveFinanceOrderSetting",
            "cfCreateOrUpdatePercentFee",
            "cfGeneratePercentFeeAuto",
            "createOrUpdatePercentVat"
        ],
        name: 'Cập nhật cài đặt tài chính',
        group_code: 'setting_finance',
        group_name: 'Cài đặt tài chính',
        cate_code: 'setting_service',
        cate_name: 'Cài đặt',
    }
};
