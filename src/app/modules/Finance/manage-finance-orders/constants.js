import { FormattedMessage, defineMessages } from 'react-intl'
import React from 'react'

const messagesSourceOrder = defineMessages({
    manual: {
        defaultMessage: 'Đơn thủ công'
    },
    platform: {
        defaultMessage: 'Đơn từ sàn'
    },
})

const OPTIONS_SOURCE_ORDER = [
    { value: 'manual', label: messagesSourceOrder.manual },
    { value: 'platform', label: messagesSourceOrder.platform },
];


const defineTextTabSeller = defineMessages({
    all: {
        defaultMessage: 'Tất cả'
    },
    exported_bills: {
        defaultMessage: "Đã xuất hóa đơn"
    },
    not_exported_bill: {
        defaultMessage: "Chưa xuất hóa đơn"
    }
})

const defineTextTabReturn = defineMessages({
    all: {
        defaultMessage: 'Tất cả'
    },
    bills_has_process: {
        defaultMessage: "Cần xử lý hủy hóa đơn"
    }
})

const defineTextStatusOrder = defineMessages({
    create_invoice: {
        defaultMessage: 'Khởi tạo hoá đơn'
    },
    published_HDDT: {
        defaultMessage: 'Đã phát hành HDDT'
    },
    create_invoice_error: {
        defaultMessage: 'Phát hành lỗi'
    },
    change_invoice: {
        defaultMessage: 'Thay đổi hóa đơn'
    },
    cancel_invoice: {
        defaultMessage: 'Đã huỷ hoá đơn'
    }

})

const STATUS_EXPORT_BILL = [
    {
        label: defineTextStatusOrder.create_invoice,
        status: 1,
        color: '#0057FF'
    },
    {
        label: defineTextStatusOrder.published_HDDT,
        status: 2,
        color: '#FE5629'
    },
    {
        label: defineTextStatusOrder.create_invoice_error,
        status: 3,
        color: '#FE5629'
    },
    {
        label: defineTextStatusOrder.change_invoice,
        status: 4,
        color: '#888484'
    },
    {
        label: defineTextStatusOrder.cancel_invoice,
        status: 5,
        color: '#888484'
    },
]

const ALL = 'all'
const EXPORTED_BILL = 1
const NOT_EXPORT_BILL = 0
const PROCESSED_BILL = 1
const NOT_PROCESSED_BILL = 0
const SELL_LOWER_COST_PRICE = 'is_lower_cost_price'

const CHILD_TAB = [
    {
        title: defineTextTabSeller.all,
        status: "",
    },
    {
        title: defineTextTabSeller.exported_bills,
        status: '1',
    },
    {
        title: defineTextTabSeller.not_exported_bill,
        status: '0',
    }
];

const CHILD_TAB_RETURN_ORDER = [
    {
        title: defineTextTabReturn.all,
        status: "",
    },
    {
        title: defineTextTabReturn.bills_has_process,
        status: '1',
    },
];

const RETURN_ORDER_STATUS = 4
const MISA_TEMPLATE_STATUS = 5
const ORDER_STATUS = 3

const TAB_SELL_PRODUCT = 1
const TAB_RETURN_SELL_PRODUCT = 2

const messagesHelperOrder = defineMessages({
    order_shipped: {
        defaultMessage: 'Đã giao cho ĐVVC'
    },
    order_completed: {
        defaultMessage: 'Hoàn thành'
    },
    order_confirm_receive: {
        defaultMessage: 'Đã giao cho người mua'
    },
    order_cancelled: {
        defaultMessage: 'Hủy'
    },
    order_prosessed: {
        defaultMessage: 'Chờ lấy hàng'
    },
})

const STATUS_ORDER_DETAIL = {
    "SHIPPED": messagesHelperOrder.order_shipped,
    "COMPLETED": messagesHelperOrder.order_completed,
    "TO_CONFIRM_RECEIVE": messagesHelperOrder.order_confirm_receive,
    "CANCELLED": messagesHelperOrder.order_cancelled,
    "PROCESSED": messagesHelperOrder.order_prosessed,
};



export {
    OPTIONS_SOURCE_ORDER,
    MISA_TEMPLATE_STATUS,
    PROCESSED_BILL,
    NOT_PROCESSED_BILL,
    CHILD_TAB_RETURN_ORDER,
    STATUS_EXPORT_BILL,
    STATUS_ORDER_DETAIL,
    ALL,
    NOT_EXPORT_BILL,
    EXPORTED_BILL,
    CHILD_TAB,
    RETURN_ORDER_STATUS,
    ORDER_STATUS, TAB_SELL_PRODUCT,
    TAB_RETURN_SELL_PRODUCT,
    SELL_LOWER_COST_PRICE
}