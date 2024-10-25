import React from "react";
import { FormattedMessage } from "react-intl";

const OPTIONS_CONFIG_PICKUP = [
    {
        value: 'grp',
        label: <FormattedMessage defaultMessage="Gom đơn xuất" />,
        tooltip: <FormattedMessage defaultMessage="Hệ thống sẽ chia thành 2 loại danh sách gồm kiện có 1 sản phẩm và kiện có nhiều sản phẩm" />,
        subOptions: [
            { value: 'sio', label: <FormattedMessage defaultMessage="Kiện hàng có 1 sản phẩm" /> },
            { value: 'mio', label: <FormattedMessage defaultMessage="Kiện hàng có nhiều sản phẩm" /> },
        ]
    },
    {
        value: 'pts',
        label: <FormattedMessage defaultMessage="Đơn hỗn hợp (1 và nhiều sản phẩm)" />,
        tooltip: <FormattedMessage defaultMessage="Danh sách được tạo sẽ gồm tất cả các kiện hàng" />
    },
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
        value: 'sku',
        label: "SKU hàng hóa kho",
        placeholder: "Nhập SKU hàng hóa kho, cách nhau bởi dấu phẩy"
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
    // {
    //     value: 'type_parcel',
    //     label: "SL sản phẩm/đơn",
    //     placeholder: "Tất cả"
    // },
];

const OPTIONS_PROCESSING_DEADLINE = [
    { label: 'Sắp hết hạn', value: 'expiring_soon' },
    { label: 'Hết hạn', value: 'expired' }
];

const OPTIONS_TYPE_PARCEL = [
    { value: 5, label: 'Một sản phẩm' },
    { value: 3, label: 'Nhiều sản phẩm' },
];

const STATUS_PICKUP = {
    1: <FormattedMessage defaultMessage="Mới" />,
    2: <FormattedMessage defaultMessage="Sẵn sàng đóng" />,
    3: <FormattedMessage defaultMessage="Đang đóng hàng" />,
    4: <FormattedMessage defaultMessage="Hủy" />,
    5: <FormattedMessage defaultMessage="Đã đóng hàng" />,
};

const TABS_STATUS_FULFILLMENT = [
    {
        status: '',
        title: <FormattedMessage defaultMessage="Tất cả" />,
        total: 0
    },
    {
        status: 1,
        title: <FormattedMessage defaultMessage="Mới" />,
        total: 0
    },
    {
        status: 2,
        title: <FormattedMessage defaultMessage="Sẵn sàng đóng" />,
        total: 0
    },
    {
        status: 3,
        title: <FormattedMessage defaultMessage="Đang đóng hàng" />,
        total: 0
    },
    {
        status: 5,
        title: <FormattedMessage defaultMessage="Đã đóng hàng" />,
        total: 0
    },
    {
        status: 4,
        title: <FormattedMessage defaultMessage="Hủy" />,
        total: 0
    },
];

const STATUS_SESSION_DELIVERY = {
    1: <FormattedMessage defaultMessage="Mới" />,
    3: <FormattedMessage defaultMessage="Hoàn thành" />,
    2: <FormattedMessage defaultMessage="Hủy" />,
};

const TABS_STATUS_SESSION_DELIVERY = [
    {
        status: '',
        title: <FormattedMessage defaultMessage="Tất cả" />,
        total: 0
    },
    {
        status: 1,
        title: <FormattedMessage defaultMessage="Mới" />,
        total: 0
    },
    {
        status: 3,
        title: <FormattedMessage defaultMessage="Hoàn thành" />,
        total: 0
    },
    {
        status: 2,
        title: <FormattedMessage defaultMessage="Hủy" />,
        total: 0
    },
];

const OPTIONS_TYPE_PICKUP = {
    "mio": "Nhiều sản phẩm",
    "sio": "Một sản phẩm",
    "pts": "Đơn hỗn hợp",
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

const OPTIONS_SEARCH_SCAN = [
    { value: 'tracking_number', label: 'Mã vận đơn' },
    { value: 'system_package_number', label: 'Mã kiện hàng' },
];

const OPTIONS_SEARCH_SCAN_RECEIVED = [
    { value: 'tracking_number', label: 'Mã vận đơn' },
    { value: 'ref_order_id', label: 'Mã đơn hàng' },
];

const OPTIONS_SEARCH_SELECT_RECEIVED = [
    { value: 'tracking_number', label: 'Mã vận đơn' },
    { value: 'ref_order_id', label: 'Mã đơn hàng' },
    { value: 'ref_return_id', label: 'Mã trả hàng' },
    { value: 'return_tracking_number', label: 'Mã vận đơn trả hàng' },
];

const OPTIONS_SEARCH_SESSION_DELIVERY = [
    { value: 'created_at', label: 'Thời gian tạo' },
    { value: 'handover_at', label: 'Thời gian bàn giao' },
];

const OPTIONS_SEARCH_SESSION_RECIEVED = [
    { value: 'created_at', label: 'Thời gian tạo' },
    { value: 'received_at', label: 'Thời gian nhận' },
];

const TYPE_ORDER_SESSION_RECEIVED = {
    1: <FormattedMessage defaultMessage="Đơn hàng" />,
    2: <FormattedMessage defaultMessage="Hủy bất thường" />,
    3: <FormattedMessage defaultMessage="Đơn hoàn" />,
};

export {
    OPTIONS_TYPE_PICKUP, OPTIONS_CONFIG_PICKUP, OPTIONS_FILTER_PICKUP, OPTIONS_PROCESSING_DEADLINE,
    OPTIONS_TYPE_PARCEL, OPTIONS_ORDER_BY, STATUS_PICKUP, TABS_STATUS_FULFILLMENT, OPTIONS_SEARCH_SCAN,
    STATUS_SESSION_DELIVERY, TABS_STATUS_SESSION_DELIVERY, OPTIONS_SEARCH_SESSION_DELIVERY,
    OPTIONS_SEARCH_SCAN_RECEIVED, OPTIONS_SEARCH_SELECT_RECEIVED, TYPE_ORDER_SESSION_RECEIVED, OPTIONS_SEARCH_SESSION_RECIEVED
}

