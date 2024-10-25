import React from 'react';
import { FormattedMessage } from 'react-intl';

const FRAME_WAREHOUSE = [
    { value: 1,  label: <FormattedMessage defaultMessage='Thư viện riêng' /> },
    { value: 2,  label: <FormattedMessage defaultMessage='Thư viện chung' /> },
];

const FRAME_TABS = [
    { value: 1, label: <FormattedMessage defaultMessage='Khung' /> },
    { value: 2, label: <FormattedMessage defaultMessage='Voucher' /> },
    { value: 3, label: <FormattedMessage defaultMessage='Khung quà tặng' /> },
    { value: 4, label: <FormattedMessage defaultMessage='Icons' /> },
    { value: 5, label: <FormattedMessage defaultMessage='Khác' /> },
];

export { FRAME_WAREHOUSE, FRAME_TABS };