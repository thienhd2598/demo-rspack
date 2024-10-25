import { FormattedMessage, defineMessages } from 'react-intl'
import React from 'react'
import client from '../../../apollo';
import query_sme_catalog_product_variant from '../../../graphql/query_sme_catalog_product_variant';
import query_scGetProductVariantByIds from '../../../graphql/query_scGetProductVariantByIds';

const messagesHelperOrder = defineMessages({
    order_all: {
        defaultMessage: 'Tất cả'
    },
    order_new: {
        defaultMessage: 'Đơn hàng mới'
    },
    order_pending: {
        defaultMessage: 'Chờ duyệt'
    },
    waiting_for_packing: {
        defaultMessage: 'Chờ đóng gói'
    },
    waiting_for_the_goods: {
        defaultMessage: 'Chờ lấy hàng'
    },
    order_packing: {
        defaultMessage: 'Đang đóng gói'
    },
    order_creating: {
        defaultMessage: 'Đang tạo vận đơn'
    },
    order_shipped: {
        defaultMessage: 'Đã giao cho ĐVVC'
    },
    order_retry_ship: {
        defaultMessage: 'Giao hàng lại'
    },
    order_failed_delivery: {
        defaultMessage: 'Giao hàng thất bại'
    },
    order_completed: {
        defaultMessage: 'Hoàn thành'
    },
    order_cancelled: {
        defaultMessage: 'Hủy'
    },
    order_other: {
        defaultMessage: 'Khác'
    },
    order_pack_error: {
        defaultMessage: 'Chuẩn bị hàng lỗi'
    },
    order_pack_lack: {
        defaultMessage: 'Thiếu hàng'
    },
    order_confirm_receive: {
        defaultMessage: 'Đã giao cho người mua'
    },
})

const STATUS_ORDER_DETAIL = {
    "": messagesHelperOrder.order_all,
    "CREATED": messagesHelperOrder.order_new,
    "PENDING": messagesHelperOrder.order_pending,
    "pending": messagesHelperOrder.waiting_for_packing,
    "packed": messagesHelperOrder.waiting_for_the_goods,
    "packing": messagesHelperOrder.order_packing,
    "creating": messagesHelperOrder.order_creating,
    "SHIPPED": messagesHelperOrder.order_shipped,
    "RETRY_SHIP": messagesHelperOrder.order_retry_ship,
    "FAILED_DELIVERY": messagesHelperOrder.order_failed_delivery,
    "COMPLETED": messagesHelperOrder.order_completed,
    "CANCELLED": messagesHelperOrder.order_cancelled,
    // "TO_RETURN": 'Đang xử lý hoàn',
    // "RETURNED": 'Trả hàng',
    "OTHER": messagesHelperOrder.order_other,
    "pack_error": messagesHelperOrder.order_pack_error,
    "pack_lack": messagesHelperOrder.order_pack_lack,
    "TO_CONFIRM_RECEIVE": messagesHelperOrder.order_confirm_receive
};

const messagesHelperPack = defineMessages({
    pending: {
        defaultMessage: 'Chờ duyệt '
    },
    waiting_for_packing: {
        defaultMessage: 'Chờ đóng gói'
    },
    wait_shipping_carrier: {
        defaultMessage: 'Chờ phân bổ ĐVVC'
    },
    packing: {
        defaultMessage: 'Đang đóng gói'
    },
    packed: {
        defaultMessage: 'Chờ lấy hàng'
    },
    shipped: {
        defaultMessage: 'Đã giao cho người mua '
    },
    shipping: {
        defaultMessage: 'Đã giao cho ĐVVC'
    },
    completed: {
        defaultMessage: 'Hoàn thành'
    },
    cancelled: {
        defaultMessage: 'Huỷ'
    },
    in_cancel: {
        defaultMessage: 'Chờ xử lý hủy'
    },
    other: {
        defaultMessage: 'Khác'
    },
})

const STATUS_ORDER_PACK = {
    "pending": messagesHelperPack.pending,
    "waiting_for_packing": messagesHelperPack.waiting_for_packing,
    "wait_shipping_carrier": messagesHelperPack.wait_shipping_carrier,
    "packing": messagesHelperPack.packing,
    "packed": messagesHelperPack.packed,
    "error_seller": messagesHelperPack.error_seller,
    "error_warehouse": messagesHelperPack.error_warehouse,
    "shipped": messagesHelperPack.shipped,
    "completed": messagesHelperPack.completed,
    "cancelled": messagesHelperPack.cancelled,
    "in_cancel": messagesHelperPack.in_cancel,
    "not_warehouse": messagesHelperPack.not_warehouse,
    "shipping": messagesHelperPack.shipping,
};

const STATUS_ORDER = [
    {
        title: <FormattedMessage defaultMessage="Tất cả" />,
        status: '',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Chờ duyệt" />,
        status: 'PENDING',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Đóng gói" />,
        sub: [
            {
                status: 'pending',
                name: <FormattedMessage defaultMessage='Chờ đóng gói' />,
                default: true
            },
            {
                status: 'creating',
                name: <FormattedMessage defaultMessage='Đang tạo vận đơn' />,
            },
            {
                status: 'packing',
                name: <FormattedMessage defaultMessage='Đang đóng gói' />,
            },

            // {
            //     status: 'pack_lack',
            //     name: 'Thiếu hàng',
            // },
            // {
            //     status: 'pack_error',
            //     name: 'Chuẩn bị hàng lỗi',
            // }
        ]
    },
    {
        title: <FormattedMessage defaultMessage="Chờ lấy hàng" />,
        status: 'packed',
        sub: []
    },

    {
        title: <FormattedMessage defaultMessage="Xử lý lỗi" />,
        sub: [
            {
                status: 'connector_channel_error',
                name: <FormattedMessage defaultMessage='Lỗi sàn TMĐT' />,
                default: true
            },
            {
                status: 'warehouse_error_code',
                name: <FormattedMessage defaultMessage='Lỗi kho' />,
            },
            {
                status: 'logistic_provider_error',
                name: <FormattedMessage defaultMessage='Lỗi ĐVVC' />,
            },
        ]
    },
    {
        title: <FormattedMessage defaultMessage="Đang giao hàng" />,
        sub: [
            {
                status: 'SHIPPED',
                name: <FormattedMessage defaultMessage='Đã giao cho ĐVVC' />,
                default: true,

            },
            {
                status: 'TO_CONFIRM_RECEIVE',
                name: <FormattedMessage defaultMessage='Đã giao cho người mua' />,
            },
        ]
    },
    {
        title: <FormattedMessage defaultMessage="Hoàn thành" />,
        status: 'COMPLETED',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage='Hủy' />,
        status: 'CANCELLED',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage='Chưa có kho xử lý' />,
        status: 'NONE_MAP_WAREHOUSE',
        sub: []
    }
];
const OPTIONS_AFTER_SALE_TYPE = [{ label: 'Đơn mới', value: 0 }, { label: 'Gửi bù hàng', value: 1 }, { label: 'Đổi hàng lỗi', value: 2 }, { label: 'Đổi sản phẩm ', value: 3 }]
const OPTIONS_PROCESSING_DEADLINE = [{ label: 'Sắp hết hạn', value: 'expiring_soon' }, { label: 'Quá hạn ', value: 'expired' }]

const STATUS_PACK_MAIN_ORDER_TAB = [
    {
        title: <FormattedMessage defaultMessage="Tất cả" />,
        status: '',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Chờ duyệt" />,
        status: 'pending',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Đóng gói" />,
        sub: [
            {
                status: 'wait_shipping_carrier',
                name: <FormattedMessage defaultMessage='Chờ phân bổ ĐVVC' />,                
            },
            {
                status: 'ready_to_ship',
                name: <FormattedMessage defaultMessage='Chờ đóng gói' />,
                default: true
            },
            {
                status: 'packing',
                name: <FormattedMessage defaultMessage='Đang đóng gói' />,
            },

        ]
    },
    {
        title: <FormattedMessage defaultMessage="Chờ lấy hàng" />,
        status: 'packed',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Xử lý lỗi" />,
        sub: [
            {
                status: 'connector_channel_error',
                name: <FormattedMessage defaultMessage='Lỗi sàn TMĐT' />,
                default: true
            },
            {
                status: 'warehouse_error',
                name: <FormattedMessage defaultMessage='Lỗi kho' />,
            },
            {
                status: 'logistic_provider_error',
                name: <FormattedMessage defaultMessage='Lỗi ĐVVC' />,
            },
            {
                status: 'pickup_retry',
                name: <FormattedMessage defaultMessage='Chưa tìm được tài xế' />,
            },
        ]
    },
    {
        title: <FormattedMessage defaultMessage="Đang giao hàng" />,
        sub: [
            {
                status: 'shipping',
                name: <FormattedMessage defaultMessage='Đã giao cho ĐVVC' />,
                default: true,

            },
            {
                status: 'shipped',
                name: <FormattedMessage defaultMessage='Đã giao cho người mua' />,
            },
        ]
    },
    {
        title: <FormattedMessage defaultMessage="Hoàn thành" />,
        status: 'completed',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage='Hủy' />,
        sub: [
            {
                status: 'in_cancel',
                name: <FormattedMessage defaultMessage='Chờ xử lý hủy' />,
                
            },
            {
                status: 'cancelled',
                name: <FormattedMessage defaultMessage='Đã hủy' />,
                default: true,
            },
        ]
    },
    {
        title: <FormattedMessage defaultMessage='Chưa có kho xử lý' />,
        status: 'NONE_MAP_WAREHOUSE',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Thông tin vận đơn" />,
        sub: [
            {
                status: 'shipment_pending',
                name: <FormattedMessage defaultMessage='Chưa tạo vận đơn' />,
                default: true,

            },
            {
                status: 'shipment_creating',
                name: <FormattedMessage defaultMessage='Đang tạo vận đơn' />,
            },
            {
                status: 'shipment_loaded_shipment',
                name: <FormattedMessage defaultMessage='Đã tải vận đơn' />,
            },
        ]
    },
];

const STATUS_PACK_TAB = [
    {
        title: <FormattedMessage defaultMessage="Tất cả" />,
        status: '',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Chờ duyệt" />,
        status: 'pending',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Đóng gói" />,
        sub: [
            {
                status: 'ready_to_ship',
                name: <FormattedMessage defaultMessage='Chờ đóng gói' />,
                default: true
            },
            {
                status: 'packing',
                name: <FormattedMessage defaultMessage='Đang đóng gói' />,
            },

        ]
    },
    {
        title: <FormattedMessage defaultMessage="Chờ lấy hàng" />,
        status: 'packed',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Xử lý lỗi" />,
        sub: [
            {
                status: 'connector_channel_error',
                name: <FormattedMessage defaultMessage='Lỗi sàn TMĐT' />,
                default: true
            },
            {
                status: 'warehouse_error',
                name: <FormattedMessage defaultMessage='Lỗi kho' />,
            },
            {
                status: 'logistic_provider_error',
                name: <FormattedMessage defaultMessage='Lỗi ĐVVC' />,
            },
        ]
    },
    {
        title: <FormattedMessage defaultMessage="Đang giao hàng" />,
        sub: [
            {
                status: 'shipping',
                name: <FormattedMessage defaultMessage='Đã giao cho ĐVVC' />,
                default: true,

            },
            {
                status: 'shipped',
                name: <FormattedMessage defaultMessage='Đã giao cho người mua' />,
            },
        ]
    },
    {
        title: <FormattedMessage defaultMessage="Hoàn thành" />,
        status: 'completed',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage='Hủy' />,
        status: 'cancelled',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage='Chưa có kho xử lý' />,
        status: 'NONE_MAP_WAREHOUSE',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Thông tin vận đơn" />,
        sub: [
            {
                status: 'shipment_pending',
                name: <FormattedMessage defaultMessage='Chưa tạo vận đơn' />,
                default: true,

            },
            {
                status: 'shipment_creating',
                name: <FormattedMessage defaultMessage='Đang tạo vận đơn' />,
            },
            {
                status: 'shipment_loaded_shipment',
                name: <FormattedMessage defaultMessage='Đã tải vận đơn' />,
            },
        ]
    },
];

const STATUS_FAIL_DELIVERY_ORDER = [
    {
        title: <FormattedMessage defaultMessage="Giao hàng thất bại" />,
        status: 'delivery_fail',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Thất lạc & hư hỏng" />,
        status: 'delivery_lost',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Hủy trước khi giao ĐVVC" />,
        status: 'delivery_cancel',
        sub: []
    },
    {
        title: <FormattedMessage defaultMessage="Hủy khi đang đóng gói" />,
        status: 'delivery_packing_cancel',
        sub: []
    },
];

const messagesSourceOrder = defineMessages({
    manual: {
        defaultMessage: 'Đơn thủ công'
    },
    platform: {
        defaultMessage: 'Đơn từ sàn'
    },
})

const OPTIONS_SOURCE_ORDER = [
    { value: 'platform', label: messagesSourceOrder.platform },
    { value: 'manual', label: messagesSourceOrder.manual },
];

const OPTIONS_ORDER = [
    { value: 0, label: 'Đơn không có thay đổi' },
    { value: 1, label: 'Đơn có thay đổi' },
];

const PRICE_IN_ORDER_OPTION = [
    { value: 0, label: 'Bán cao hơn giá vốn' },
    { value: 1, label: 'Bán thấp hơn giá vốn' },
];

const queryGetSmeProductVariants = async (ids) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: query_sme_catalog_product_variant,
        variables: {
            where: {
                id: { _in: ids?.filter(Boolean) },
            },
        },
        fetchPolicy: "network-only",
    });

    return data?.sme_catalog_product_variant || [];
}

const queryGetScProductVariants = async (ids) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: query_scGetProductVariantByIds,
        variables: {
            ids: ids,
        },
        fetchPolicy: "network-only",
    });
    return data?.scGetProductVariantByIds.variants || [];
}
const PATTERN_URL = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/

export {
    STATUS_PACK_TAB,
    STATUS_PACK_MAIN_ORDER_TAB,
    PATTERN_URL,
    OPTIONS_AFTER_SALE_TYPE,
    STATUS_ORDER,
    OPTIONS_PROCESSING_DEADLINE,
    STATUS_ORDER_DETAIL,
    STATUS_ORDER_PACK,
    STATUS_FAIL_DELIVERY_ORDER,
    messagesHelperOrder,
    OPTIONS_SOURCE_ORDER,
    OPTIONS_ORDER,
    PRICE_IN_ORDER_OPTION,
    queryGetSmeProductVariants,
    queryGetScProductVariants
};