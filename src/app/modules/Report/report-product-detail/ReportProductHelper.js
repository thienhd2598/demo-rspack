import React from 'react';
import { FormattedMessage } from 'react-intl';

const TABS_REPORT_PRODUCT = [
    { id: 1, title: <FormattedMessage defaultMessage='Sản phẩm hiệu quả' /> },
    { id: 2, title: <FormattedMessage defaultMessage='Sản phẩm cần cải thiện' /> },
];

const TABS_REPORT_PRODUCT_EFFECTIVE = [
    { id: 1, title: <FormattedMessage defaultMessage='Theo doanh số' /> },
    { id: 2, title: <FormattedMessage defaultMessage='Theo số sản phẩm' /> },
];

const TABS_REPORT_PRODUCT_NEED_IMPROVE = [
    { id: 1, title: <FormattedMessage defaultMessage='Doanh số giảm' /> },
    { id: 2, title: <FormattedMessage defaultMessage='Tỷ lệ hoàn trả cao' /> },
];

export {
    TABS_REPORT_PRODUCT,
    TABS_REPORT_PRODUCT_EFFECTIVE,
    TABS_REPORT_PRODUCT_NEED_IMPROVE
};