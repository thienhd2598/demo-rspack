import { FormattedMessage } from 'react-intl';
import React from 'react';

const SEARCH_OPTIONS = [
    { value: 'name', label: <FormattedMessage defaultMessage='Tên phiếu dự trữ' /> },
    { value: 'sku', label: <FormattedMessage defaultMessage='SKU hàng hoá' /> },
    { value: 'product_name', label: <FormattedMessage defaultMessage='Tên sản phẩm' /> },
];

const STATUS_LIST_RESERVE = [
    { 
        title: <FormattedMessage defaultMessage='Tất cả' />, 
        status: '' 
    },
    { 
        title: <FormattedMessage defaultMessage='Đang dự trữ' />, 
        status: 'done'
    },
    { 
        title: <FormattedMessage defaultMessage='Kết thúc' />, 
        status: 'finished' 
    },
    { 
        title: <FormattedMessage defaultMessage='Dự trữ lỗi' />, 
        status: 'error'
    },
];

export { SEARCH_OPTIONS, STATUS_LIST_RESERVE };