import { FormattedMessage, defineMessages } from 'react-intl'
import React from 'react'

const defineTextTab = defineMessages({
    auto_rating: {
        defaultMessage: 'Thiết lập trả lời đánh giá tự động'
    },
    example_reply: {
        defaultMessage: "Mẫu trả lời"
    }
})

const TABS = [
    {
        title: defineTextTab.auto_rating,
        key: "autoRating",
    },
    {
        title: defineTextTab.example_reply,
        key: "exampleReply",
    },
];
const childrenTab = defineMessages({
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

const STARTAB = [
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


export { TABS, STARTAB }