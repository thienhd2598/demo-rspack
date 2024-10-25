import { FormattedMessage, defineMessages } from 'react-intl'
import React from 'react'

const defineTextSub = defineMessages({
    synced_success: {
        defaultMessage: "Đã đồng bộ"
    },
    not_synced: {
        defaultMessage: "Chưa đồng bộ"
    },
    synced_faild: {
        defaultMessage: "Đồng bộ thất bại"
    },
})

const SUBTAB = [
    {
        title: defineTextSub.synced_success,
        status: 'synced_success',
    },
    {
        title: defineTextSub.not_synced,
        status: 'not_synced'
    },
    {
        title: defineTextSub.synced_faild,
        status: 'synced_faild',
    },

]

export { SUBTAB}