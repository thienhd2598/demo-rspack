import React from 'react';
import { FormattedMessage } from 'react-intl';

const OPTIONS_GROUP_COST = [
    { value: 1, label: <FormattedMessage defaultMessage=' Chi phí vận hành' /> },
    { value: 2, label: <FormattedMessage defaultMessage='Chi phí MKT' /> },
    { value: 3, label: <FormattedMessage defaultMessage='Chi phí nội sàn' /> },
];
const OPTIONS_COST_METHOD = [
    { value: 1, label: <FormattedMessage defaultMessage='Phân bổ theo gian hàng' /> },
    { value: 2, label: <FormattedMessage defaultMessage='Phân bổ theo đơn hàng' /> },    
];

export { OPTIONS_GROUP_COST, OPTIONS_COST_METHOD };