import { FormattedMessage, defineMessages } from 'react-intl'
import React from 'react'
const DEFAULT_POSITION_ACTION = 128
const defineTextSub = defineMessages({
    all: {
        defaultMessage: "Tất cả"
    },
    feedbacked: {
        defaultMessage: "Đã phản hồi"
    },
    not_feedback: {
        defaultMessage: "Chưa phản hồi"
    },
    error_feedback: {
        defaultMessage: "Phản hồi lỗi"
    },
})

const childrenTab = defineMessages({
    all: {
        defaultMessage: "Tất cả"
    },
    '5_star': {
        defaultMessage: "5 sao"
    },
    '4_star': {
        defaultMessage: "4 sao"
    },
    '3_star': {
        defaultMessage: "3 sao"
    },
    '2_star': {
        defaultMessage: "2 sao"
    },
    '1_star': {
        defaultMessage: "1 sao"
    },
})

const CHILDREN_TAB = [
    {
        title: childrenTab.all,
        star: '',
    },
    {
        title: childrenTab['5_star'],
        star: 5
    },
    {
        title: childrenTab['4_star'],
        star: 4,
    },
    {
        title: childrenTab['3_star'],
        star: 3,
    },
    {
        title: childrenTab['2_star'],
        star: 2,
    },
    {
        title: childrenTab['1_star'],
        star: 1,
    },
]

const SUBTAB = [
    {
        title: defineTextSub.all,
        status: '',
    },
    {
        title: defineTextSub.feedbacked,
        status: 'reply'
    },
    {
        title: defineTextSub.not_feedback,
        status: 'not_reply',
    },
    {
        title: defineTextSub.error_feedback,
        status: 'reply_error',
    },
]

const defineOptionsSearch = defineMessages({
    order_id: {
        defaultMessage: "Mã đơn hàng"
    },
    product_name: {
        defaultMessage: "Tên sản phẩm"
    }
})


const optionsSearch = [
    {
        value: 'ref_order_id',
        label: defineOptionsSearch.order_id,
    },
    {
        value: 'product_name',
        label: defineOptionsSearch.product_name,
    },
];

export { DEFAULT_POSITION_ACTION, optionsSearch, SUBTAB, CHILDREN_TAB }