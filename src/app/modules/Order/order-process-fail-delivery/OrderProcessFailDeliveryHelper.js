import React from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';


/** State */
const messages = defineMessages({
    phScanTrackingNumber: {
        defaultMessage: 'Quét hoặc nhập mã vận đơn huỷ bất thường'
    },
    phScanRefOrderId: {
        defaultMessage: 'Quét hoặc nhập mã đơn huỷ bất thường'
    },
    phSearchTrackingNumber: {
        defaultMessage: 'Tìm vận đơn'
    },
    phSearchRefOrderId: {
        defaultMessage: 'Tìm đơn hàng'
    },
});

const OPTIONS_PROTOCOL = [
    {
        value: 1,
        label: <FormattedMessage defaultMessage="Không nhập kho" />,
    },
    {
        value: 2,
        label: <FormattedMessage defaultMessage="Nhập kho" />,
    },
];

const OPTIONS_SCAN = [
    {
        value: 'tracking_number',
        label: <FormattedMessage defaultMessage="Mã vận đơn" />,
        placeholder: messages.phScanTrackingNumber
    },
    {
        value: 'ref_order_id',
        label: <FormattedMessage defaultMessage="Mã đơn hàng" />,
        placeholder: messages.phScanRefOrderId
    },
];

const OPTIONS_SEARCH = [
    {
        value: 'tracking_number',
        label: <FormattedMessage defaultMessage="Mã vận đơn" />,
        placeholder: messages.phSearchTrackingNumber
    },
    {
        value: 'ref_order_id',
        label: <FormattedMessage defaultMessage="Mã đơn hàng" />,
        placeholder: messages.phSearchRefOrderId
    },
];

/** Function */

export {
    OPTIONS_PROTOCOL,
    OPTIONS_SCAN,
    OPTIONS_SEARCH,    
};