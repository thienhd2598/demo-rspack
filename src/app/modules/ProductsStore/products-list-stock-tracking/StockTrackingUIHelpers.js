import { FormattedMessage, defineMessages} from 'react-intl'
import React from 'react'

const msgStatus = defineMessages({
    all: {
        defaultMessage: "Tất cả"
    },
    reject: {
        defaultMessage: "Thất bại"
    },
    success: {
        defaultMessage: "Thành công"
    }
})
const STATUS = [
    {
        title: msgStatus.all,
        status: "",
    },
    {
        title: msgStatus.reject,
        status: "0",
    },
    {
        title: msgStatus.success,
        status: "1",
    },
];

export { STATUS };