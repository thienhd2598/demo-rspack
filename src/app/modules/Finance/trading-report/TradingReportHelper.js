import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';

const TABS_TRADING_REPORT = [
    { value: 'overview', label: <FormattedMessage defaultMessage='Tổng quan' /> },
    { value: 'channel', label: <FormattedMessage defaultMessage='Theo sàn' /> },
];

const STATUS_ORDER = [
    { value: 'completed', label: <FormattedMessage defaultMessage='Hoàn thành' /> },
    { value: 'payout', label: <FormattedMessage defaultMessage='Đã quyết toán' /> },
    { value: 'shipped', label: <FormattedMessage defaultMessage='Đã giao cho ĐVVC' /> },
];

const ORDER_TYPE_OPTIONS = [
    { value: 'order_at', label: <FormattedMessage defaultMessage="Thời gian đặt hàng" /> },
    { value: 'completed_at', label: <FormattedMessage defaultMessage="Thời gian hoàn thành" /> },
    { value: 'payout_time', label: <FormattedMessage defaultMessage="Thời gian đơn được quyết toán" /> },
];

const DATE_TYPE_OPTIONS = [
    { value: 1, label: <FormattedMessage defaultMessage='Năm' /> },
    { value: 2, label: <FormattedMessage defaultMessage='Quý' /> },
    { value: 3, label: <FormattedMessage defaultMessage='Tháng' /> },
    { value: 4, label: <FormattedMessage defaultMessage='Tuần' /> },
    { value: 5, label: <FormattedMessage defaultMessage='Ngày' /> },
];

const COMPARE_TYPE_OPTIONS = [
    { value: 1, label: <FormattedMessage defaultMessage='Kỳ trước' /> },
    { value: 2, label: <FormattedMessage defaultMessage='Cùng kỳ năm trước' /> },
];

const financeDashboardDefineMss = defineMessages({
    profit: {
        defaultMessage: 'Lợi nhuận'
    },
    revenue_sell: {
        defaultMessage: 'Doanh thu bán hàng'
    },
    discount_sales: {
        defaultMessage: 'Giảm giá hàng bán'
    },
    capital_price: {
        defaultMessage: 'Giá vốn'
    },
    fees_platform: {
        defaultMessage: 'Chi phí nội sàn'
    },
    marketing_costs: {
        defaultMessage: 'Chi phí MKT'
    },
    operating_costs: {
        defaultMessage: 'Chi phí vận hành'
    },
})

const KEY_FINANCE_DASHBOARD_CHART = {
    'profit': {
        color: '#00DB6D',
        label: financeDashboardDefineMss.profit
    },
    'revenue_sell': {
        color: '#2589f5',
        label: financeDashboardDefineMss.revenue_sell
    },
    'discount_sales': {
        color: '#FCB1A6',
        label: financeDashboardDefineMss.discount_sales
    },
    'capital_price': {
        color: '#FFE602',
        label: financeDashboardDefineMss.capital_price
    },
    'fees_platform': {
        color: '#C4C4C4',
        label: financeDashboardDefineMss.fees_platform
    },
    'marketing_costs': {
        color: '#B4D7EE',
        label: financeDashboardDefineMss.marketing_costs
    },
    'operating_costs': {
        color: ' #FCE691',
        label: financeDashboardDefineMss.operating_costs
    },
};

export { STATUS_ORDER, TABS_TRADING_REPORT, ORDER_TYPE_OPTIONS, DATE_TYPE_OPTIONS, COMPARE_TYPE_OPTIONS, KEY_FINANCE_DASHBOARD_CHART };