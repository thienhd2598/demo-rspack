import React from "react";
import { FormattedMessage } from "react-intl";

const OPTIONS_CONFIG_PICKUP = [
    { value: 'smio', label: <FormattedMessage defaultMessage="Gom đơn xuất" /> },
    { value: 'pto', label: <FormattedMessage defaultMessage="Lấy hàng theo đơn xuất (PTO)" /> },
];

const OPTIONS_FILTER_PICKUP = [
    {
        value: 'ref_order_id',
        label: "Mã đơn hàng",
        placeholder: "Nhập mã đơn hàng, cách nhau bởi dấu phẩy"
    },
    {
        value: 'tracking_number',
        label: "Mã vận đơn",
        placeholder: "Nhập mã vận đơn, cách nhau bởi dấu phẩy"
    },
    {
        value: 'range_time',
        label: "Ngày tạo đơn",
        placeholder: "Chọn ngày tạo đơn"
    },
    {
        value: 'channel',
        label: "Sàn",
        placeholder: "Tất cả"
    },
    {
        value: 'store',
        label: "Gian hàng",
        placeholder: "Tất cả"
    },
    {
        value: 'shipping_unit',
        label: "ĐVVC",
        placeholder: "Tất cả"
    },
    {
        value: 'processing_deadline',
        label: "Hạn xử lý",
        placeholder: "Chọn hạn xử lý"
    },
    {
        value: 'type_parcel',
        label: "SL sản phẩm/đơn",
        placeholder: "Tất cả"
    },
];

const OPTIONS_PROCESSING_DEADLINE = [
    { label: 'Sắp hết hạn', value: 'expiring_soon' },
    { label: 'Hết hạn', value: 'expired' }
];

const OPTIONS_TYPE_PARCEL = [
    { value: 3, label: 'Một sản phẩm' },
    { value: 5, label: 'Nhiều sản phẩm' },
];

const STATUS_PICKUP = {
    1: <FormattedMessage defaultMessage="Mới" />,
    2: <FormattedMessage defaultMessage="Sẵn sàng nhặt hàng" />,
    3: <FormattedMessage defaultMessage="Đang nhặt hàng" />,
    4: <FormattedMessage defaultMessage="Đã huỷ" />,
    5: <FormattedMessage defaultMessage="Đã nhặt hàng" />,
};

const OPTIONS_TYPE_PICKUP = {
    "mio": "MIO",
    "sio": "SIO",
    "pto": "PTO",
};

const OPTIONS_ORDER_BY = [
    {
        value: 'order_at',
        label: 'Thời gian đặt hàng'
    },
    {
        value: 'last_wh_exported_at',
        label: 'Thời gian xuất kho'
    },
    {
        value: 'tts_expired',
        label: 'Hạn giao hàng'
    }
];

export { OPTIONS_TYPE_PICKUP, OPTIONS_CONFIG_PICKUP, OPTIONS_FILTER_PICKUP, OPTIONS_PROCESSING_DEADLINE, OPTIONS_TYPE_PARCEL, OPTIONS_ORDER_BY, STATUS_PICKUP };