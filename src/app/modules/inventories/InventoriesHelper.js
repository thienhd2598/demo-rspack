import React from 'react';
import { FormattedMessage } from "react-intl";


export const SEARCH_TYPE = [
    {
        value: '',
        label: <FormattedMessage defaultMessage='Tất cả sản phẩm' />
    },
    {
        value: 'in-stock',
        label: <FormattedMessage defaultMessage='Sản phẩm còn hàng' />
    },
    {
        value: 'out-stock',
        label: <FormattedMessage defaultMessage='Sản phẩm hết hàng' />
    },

]

export const SEARCH_STATUS = [
    {
        value: 'new',
        label: <FormattedMessage defaultMessage='Trạng thái mới' />
    },
    {
        value: 'other',
        label: <FormattedMessage defaultMessage='Trạng thái khác' />
    },

]
