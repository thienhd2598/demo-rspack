import React, { Fragment, memo, useEffect, useMemo } from 'react';

import { FormattedMessage, defineMessages } from 'react-intl';

const CIRCLE_CHECK_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00DB6D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
const TRIANGLE_ALERT_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
const TABS = [
    {
        title: <FormattedMessage defaultMessage="Đơn trên sàn TMĐT"/>,
        value: 1,
        source: 'platform'
    },
    {
        title: <FormattedMessage defaultMessage="Đơn thủ công"/>,
        value: 2,
        source: 'manual'
    },

];

const TYPE_IMPORTWAREHOUSE = [
    {
        label: <FormattedMessage defaultMessage="Xuất kho"/>,
        value: 1,
        code: 'outbound'
    },
    {
        label: <FormattedMessage defaultMessage="Nhập kho"/>,
        value: 2,
        code: 'inbound'
    },

];

const RESULT_RECONCILIATION = [
    {
        label: <FormattedMessage defaultMessage="Dữ liệu đúng"/>,
        value: 1,
    },
    {
        label: <FormattedMessage defaultMessage="Dữ liệu lỗi"/>,
        value: 0,
    },

];

const BOX_OVERVIEW = [
    {
        title: <FormattedMessage defaultMessage="Đơn hàng"/>,
        value: 1,
        code: 'order_sync',
        name: 'Đơn hàng'
    },
    {
        title: <FormattedMessage defaultMessage="Xuất/Nhập kho"/>,
        value: 2,
        code: 'outbound_inbound',
        name: 'Xuất/Nhập kho'
    },
    {
        title: <FormattedMessage defaultMessage="Đơn bán hàng"/>,
        value: 3,
        code: 'finance_order',
        name: 'Đơn bán hàng'
    },
    {
        title: <FormattedMessage defaultMessage="Trả lại hàng bán"/>,
        value: 4,
        code: 'return_order',
        name: 'Trả lại hàng bán'
    },
    {
        title: <FormattedMessage defaultMessage="Đơn đối soát"/>,
        value: 5,
        code: 'settlement', 
        name: 'Đơn đối soát'
    },
    {
        title: <FormattedMessage defaultMessage="Đơn quyết toán"/>,
        value: 6,
        code: 'settlement_sync',
        name: 'Đơn quyết toán'
    },

];

const OPTION_SEARCH = [
    {
        value: 2,
        label: "Mã đơn hàng" ,
        search_input: 'order_code'
    },
    {
        value: 1,
        label: "Số chứng từ" ,
        search_input: "finance_order_code"
    },
    {
        value: 3,
        label: "Mã phiếu xuất" ,
        search_input: "warehouse_bill_code"

    }
]


export {
    CIRCLE_CHECK_SVG,
    TRIANGLE_ALERT_SVG,
    RESULT_RECONCILIATION,
    BOX_OVERVIEW,
    TABS,
    TYPE_IMPORTWAREHOUSE,
    OPTION_SEARCH
}