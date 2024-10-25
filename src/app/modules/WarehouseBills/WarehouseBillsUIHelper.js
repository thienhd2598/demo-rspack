import { FormattedMessage } from 'react-intl';
import React from 'react';
import { defineMessages } from 'react-intl';

const messagesWarehouse = defineMessages({
    phCode: {
        defaultMessage: 'Nhập mã phiếu xuất/ nhập kho'
    },
    phOrderCode: {
        defaultMessage: 'Nhập mã đơn hàng'
    },
    phShippingCode: {
        defaultMessage: 'Nhập mã vận đơn'
    },
    phVariantName: {
        defaultMessage: 'Nhập tên hàng hóa cần tìm kiếm'
    },
    phVariantSku: {
        defaultMessage: 'Nhập mã SKU hàng hóa cần tìm kiếm'
    },
    phHistoryCode: {
        defaultMessage: 'Nhập mã phiếu cần tìm kiếm'
    },
    phHistoryShippingCode: {
        defaultMessage: 'Nhập mã vận đơn cần tìm kiếm'
    },
    goods_place: {
        defaultMessage: 'Nhập mã SKU/ tên hàng hoá cần tìm kiếm'
    },
    order_code_place: {
        defaultMessage: 'Nhập mã đơn hàng cần tìm kiếm'
    }
})

const SEARCH_OPTIONS = [
    { value: 'code', label: <FormattedMessage defaultMessage='Mã phiếu' />, placeholder: messagesWarehouse.phCode },
    { value: 'order_code', label: <FormattedMessage defaultMessage='Mã đơn hàng' />, placeholder: messagesWarehouse.phOrderCode },
    { value: 'shipping_code', label: <FormattedMessage defaultMessage='Mã vận đơn' />, placeholder: messagesWarehouse.phShippingCode }
];

const SEARCH_OPTIONS_BILL_OUT = [
    { value: 'created_at', label: <FormattedMessage defaultMessage='Thời gian tạo' />, placeholder: { defaultMessage: "Thời gian tạo" } },
    { value: 'printed_date', label: <FormattedMessage defaultMessage='Thời gian in' />, placeholder: { defaultMessage: "Thời gian in" } }
];

const SEARCH_OPTIONS_HISTORY = [
    { value: 'variant-name', label: <FormattedMessage defaultMessage='Tên hàng hóa' />, placeholder: messagesWarehouse.phVariantName },
    { value: 'variant-sku', label: <FormattedMessage defaultMessage='Mã SKU hàng hóa' />, placeholder: messagesWarehouse.phVariantSku },
    { value: 'code', label: <FormattedMessage defaultMessage='Mã phiếu' />, placeholder: messagesWarehouse.phHistoryCode },
    { value: 'shipping_code', label: <FormattedMessage defaultMessage='Mã vận đơn' />, placeholder: messagesWarehouse.phHistoryShippingCode },
    { value: 'order_code', label: <FormattedMessage defaultMessage='Mã đơn hàng' />, placeholder: messagesWarehouse.order_code_place },
];

const SEARCH_OPTIONS_HISTORY_BY_GOODS = [
    { value: 'sku', label: <FormattedMessage defaultMessage='Mã SKU' />, placeholder: messagesWarehouse.goods_place },
    { value: 'name', label: <FormattedMessage defaultMessage='Tên hàng hóa' />, placeholder: messagesWarehouse.goods_place },
]

const TAB_STATUS_IN = [
    {
        title: <FormattedMessage defaultMessage='Chờ duyệt' />,
        status: 'new'
    },
    {
        title: <FormattedMessage defaultMessage='Chờ nhập' />,
        status: 'waiting'
    },
    {
        title: <FormattedMessage defaultMessage='Đã nhập' />,
        status: 'complete'
    },
    {
        title: <FormattedMessage defaultMessage='Chênh lệch sau nhập' />,
        status: 'DIF_AFTER_IMPORT'
    },
];

const TAB_WAITING_IN = [
    {
        title: <FormattedMessage defaultMessage='Tất cả' />,
        status: 'all'
    },
    {
        title: <FormattedMessage defaultMessage='Chưa nhập' />,
        status: 'notyet'
    },
    {
        title: <FormattedMessage defaultMessage='Khớp' />,
        status: 'khop'
    },
    {
        title: <FormattedMessage defaultMessage='Lệch' />,
        status: 'lech'
    },
];

const TAB_COMPLETE_IN = [
    {
        title: <FormattedMessage defaultMessage='Tất cả' />,
        status: 'all'
    },
    {
        title: <FormattedMessage defaultMessage='Khớp' />,
        status: 'khop'
    },
    {
        title: <FormattedMessage defaultMessage='Lệch' />,
        status: 'lech'
    },
];

const TAB_STATUS_OUT = [
    {
        title: <FormattedMessage defaultMessage='Chờ duyệt' />,
        status: 'new'
    },
    {
        title: <FormattedMessage defaultMessage='Đã duyệt' />,
        status: 'complete'
    },
    {
        title: <FormattedMessage defaultMessage='Đã hủy' />,
        status: 'cancel'
    },
];

const TAB_HISTORY_STATUS = [
    {
        title: <FormattedMessage defaultMessage='Tất cả' />,
        status: ''
    },
    {
        title: <FormattedMessage defaultMessage='Tồn thực tế' />,
        status: 'stock_actual'
    },
    {
        title: <FormattedMessage defaultMessage='Tồn tạm giữ' />,
        status: 'stock_allocated'
    },
    {
        title: <FormattedMessage defaultMessage='Tồn dự trữ' />,
        status: 'stock_reserve'
    },
    {
        title: <FormattedMessage defaultMessage='Tồn vận chuyển' />,
        status: 'stock_shipping'
    },
    {
        title: <FormattedMessage defaultMessage='Tạm ứng' />,
        status: 'stock_preallocate'
    },
];

const TYPE_WAREHOUSE = [
    { title: <FormattedMessage defaultMessage='NHẬP KHO' />, type: 'in' },
    { title: <FormattedMessage defaultMessage='XUẤT KHO' />, type: 'out' },
];

const HISTORY_TYPE_WAREHOUSE = [
    { title: <FormattedMessage defaultMessage='TẤT CẢ' />, type: '' },
    { title: <FormattedMessage defaultMessage='NHẬP KHO' />, type: 'in' },
    { title: <FormattedMessage defaultMessage='XUẤT KHO' />, type: 'out' },
];

const PROTOCOL_OUT = [
    {
        value: 0,
        label: <FormattedMessage defaultMessage='Xuất kho bán hàng' />,
    },
    {
        value: 1,
        label: <FormattedMessage defaultMessage='Xuất kho thủ công' />,

    },
    {
        value: 2,
        label: <FormattedMessage defaultMessage='Xuất kho chuyển kho' />,
        disabled: true
    },
];

const PROTOCOL_IN = [
    {
        value: 0,
        label: <FormattedMessage defaultMessage='Nhập kho hoàn hàng' />
    },
    // {
    //     value: 1,
    //     label: <FormattedMessage defaultMessage='Nhập kho khởi tạo' />
    // },
    {
        value: 2,
        label: <FormattedMessage defaultMessage='Nhập kho mua hàng' />,

    },
    {
        value: 3,
        label: <FormattedMessage defaultMessage='Nhập kho chuyển kho' />,
        disabled: true
    },
];

const UNIT_ADDONS = [
    { value: 0, label: <FormattedMessage defaultMessage='đ' /> },
    { value: 1, label: <FormattedMessage defaultMessage='%' /> },
];

const TYPE_HISTORY_TRANSACTION = [
    { value: "tam_giu", label: <FormattedMessage defaultMessage="Tạm giữ" /> },
    { value: "giam_tam_giu", label: <FormattedMessage defaultMessage="Giảm tạm giữ" /> },
    { value: "xuat_kho", label: <FormattedMessage defaultMessage="Xuất kho" /> },
    { value: "dang_van_chuyen", label: <FormattedMessage defaultMessage="Đang vận chuyển" /> },
    { value: "hoan_thanh_van_chuyen", label: <FormattedMessage defaultMessage="Hoàn thành vận chuyển" /> },
    { value: "nhap_kho", label: <FormattedMessage defaultMessage="Nhập kho" /> },
    { value: "du_tru", label: <FormattedMessage defaultMessage="Dự trữ" /> },
    { value: "giai_phong_du_tru", label: <FormattedMessage defaultMessage="Giải phóng dự trữ" /> },
    { value: "variant_unit_change", label: <FormattedMessage defaultMessage="Thay đổi tỷ lệ" /> },
];

const ACTOR_HISTORY_TRANSACTION = [
    { value: "order", label: <FormattedMessage defaultMessage="Bán hàng" /> },
    { value: "bill", label: <FormattedMessage defaultMessage="Xuất/nhập kho" /> },
    { value: "checklist", label: <FormattedMessage defaultMessage="Kiểm kho" /> },
    { value: "initial", label: <FormattedMessage defaultMessage="Sản phẩm - Tồn đầu" /> },
    { value: "reserve_ticket", label: <FormattedMessage defaultMessage="Dự trữ" /> },
    { value: "variant_unit", label: <FormattedMessage defaultMessage="Chuyển đổi ĐVT" /> },
    { value: "location_expired", label: <FormattedMessage defaultMessage="Hàng hết hạn" /> },
];

const PRODUCT_TYPE_OPTIONS = [{
    value: 0,
    label: <FormattedMessage defaultMessage='Sản phẩm thường' />,
    code: 'normal_product'
},
{
    value: 1,
    label: <FormattedMessage defaultMessage='Sản phẩm có hạn sử dụng' />,
    code: 'expire_warning_product'
}
]

export {
    SEARCH_OPTIONS,
    SEARCH_OPTIONS_HISTORY,
    TAB_COMPLETE_IN,
    TAB_STATUS_IN,
    TAB_STATUS_OUT,
    TAB_HISTORY_STATUS,
    TYPE_WAREHOUSE,
    PROTOCOL_IN,
    PROTOCOL_OUT,
    UNIT_ADDONS,
    HISTORY_TYPE_WAREHOUSE,
    TYPE_HISTORY_TRANSACTION,
    ACTOR_HISTORY_TRANSACTION,
    messagesWarehouse,
    SEARCH_OPTIONS_HISTORY_BY_GOODS,
    SEARCH_OPTIONS_BILL_OUT,
    PRODUCT_TYPE_OPTIONS,
    TAB_WAITING_IN
}