
import { FormattedMessage, defineMessages } from 'react-intl'
import React from 'react'
const defineTextTab = defineMessages({
    setingfinance: {
        defaultMessage: 'Cài đặt tạo đơn bán hàng/trả hàng'
    },
    settingexportbill: {
        defaultMessage: "Cài đặt xuất hóa đơn"
    },
    settingTradingReport: {
        defaultMessage: "Cài đặt báo cáo kinh doanh"
    },
    settingVAT: {
        defaultMessage: "Cài đặt VAT"
    }
})

const tabs = [
    {
        title: defineTextTab.setingfinance,
        key: "setingfinance",
    },
    {
        title: defineTextTab.settingexportbill,
        key: "settingexportbill",
    },
    {
        title: defineTextTab.settingTradingReport,
        key: "settingTradingReport",
    },
    {
        title: defineTextTab.settingVAT,
        key: "settingVAT",
    },
];

const defineTextStatus = defineMessages({
    shipped: {
        defaultMessage: 'Giao cho đơn vị vận chuyển'
    },
    toconfirmreceive: {
        defaultMessage: 'Giao cho người mua'
    },
    completed: {
        defaultMessage: 'Hoàn thành'
    },
    cancel: {
        defaultMessage: 'Phát sinh đơn bất thường'
    },
    return: {
        defaultMessage: 'Xử lý nhập kho'
    },
    packed: {
        defaultMessage: 'Chờ lấy hàng'
    },
})

const STATUS_CREATE_FINANCE = [
    {
        value: 'SHIPPED',
        label: defineTextStatus.shipped,
    },
    {
        value: 'TO_CONFIRM_RECEIVE',
        label: defineTextStatus.toconfirmreceive,
    },
    {
        value: 'COMPLETED',
        label: defineTextStatus.completed,
    },
    {
        value: 'PROCESSED',
        label: defineTextStatus.packed,
    },
];

const WHEN_CREATE_FINANCE = [
    {
        value: 'cancel',
        label: defineTextStatus.cancel,
    },
    {
        value: 'return',
        label: defineTextStatus.return,
    }
];

const INVOICE_STATUS = [
    {
        value: 'auto',
        label: <FormattedMessage defaultMessage='Tự tạo' />,
    },
    {
        value: 'export_code',
        label: <FormattedMessage defaultMessage='Theo phiếu xuất kho' />,
    },
];

const INVOICE_STATUS_RETURN = [
    {
        value: 'auto',
        label: <FormattedMessage defaultMessage='Tự tạo' />,
    },
    {
        value: 'import_code',
        label: <FormattedMessage defaultMessage='Theo phiếu nhập kho' />,
    },
];

export { INVOICE_STATUS_RETURN, WHEN_CREATE_FINANCE, tabs, STATUS_CREATE_FINANCE, INVOICE_STATUS }