import { FormattedMessage, defineMessages } from 'react-intl'
import React from 'react'
import client from '../../../apollo';
import gql from 'graphql-tag';
import query_scGetProductVariantByIdsForProduct from '../../../graphql/query_scGetProductVariantByIdsForProduct';

const queryProducts = gql`
    query scGetSmeProductByListId($list_product_id: [Int]) {
        scGetSmeProductByListId(list_product_id: $list_product_id) {
            connector_channel_code
            created_at
            updated_at
            id
            name
            ref_id
            sku      
            ref_logistic_channel_id
            platform_status
            platform_text_status      
            status
            store_id
            sum_sellable_stock
            sum_stock_on_hand
            productAssets {
                id
                origin_image_url
                position
                ref_id
                ref_url
                sc_product_id
                sme_asset_id
                sme_url
                template_image_url
                type
            }
            productVariants {
                id
                price
                price_minimum
                name
                sc_product_id
                ref_id
                ref_product_id
                stock_on_hand
                reverse_stock
                sellable_stock
                sku
                name
                variantInventoris {
                    id
                    inventory_change
                    sc_variant_id
                    sc_warehouse_id
                    stock_on_hand
                    store_id
                }
            }
        }
    }
`;

const TABS_CAMPAIGN = [
    {
        title: <FormattedMessage defaultMessage="Chương trình lẻ" />,
        type: 'single',
    },
    {
        title: <FormattedMessage defaultMessage="Chương trình hàng loạt" />,
        type: 'template'
    },
];

const TABS_DETAILS = [
    {
        title: <FormattedMessage defaultMessage="Sản phẩm khuyến mãi" />,
        status: 1,
    },
    {
        title: <FormattedMessage defaultMessage="Tính năng hỗ trợ" />,
        status: 2
    },
];

const OPTIONS_TYPE_LIMIT = [
    { value: 1, label: <FormattedMessage defaultMessage='Không giới hạn' /> },
    { value: 2, label: <FormattedMessage defaultMessage='Giới hạn' /> }
];

const TICK_SVG = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00db6d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
const STATUS_PRODUCTS = [
    {
        title: <FormattedMessage defaultMessage="Không hợp lệ" />,
        status: 1,
    },
    {
        title: <FormattedMessage defaultMessage="Thiếu sản phẩm" />,
        status: 2,
        status_tab: 'miss_product',
        sub: [
            {
                title: <FormattedMessage defaultMessage="Chương trình khuyến mãi" />,
                status: 2,
            },
            {
                title: <FormattedMessage defaultMessage="Lịch áp khung" />,
                status: 3,
            },
        ]
    },
];

const STATUS_SALE = {
    pending: {
        label: "Chờ duyệt",
        color: '#F80D0D'
    },
    coming_soon: {
        label: 'Sắp diễn ra',
        color: '#FF5629',
    },
    happening: {
        label: 'Đang diễn ra',
        color: '#3DA153',
    },
    finished: {
        label: 'Đã kết thúc',
        color: '#F80D0D',
    },
};

const OPTIONS_TYPE_DISCOUNT = [
    {
        value: 2,
        label: <FormattedMessage defaultMessage='Theo phần trăm' />
    },
    {
        value: 1,
        label: <FormattedMessage defaultMessage='Theo số tiền' />
    }
];

const OPTIONS_TYPE_VOUCHER = [
    {
        value: 1,
        label: <FormattedMessage defaultMessage='Khuyến mãi' />
    },
    {
        value: 3,
        label: <FormattedMessage defaultMessage='Hoàn xu' />
    },
];

const OPTIONS_CONFIG_DISPLAY = [
    {
        value: 1,
        label: <FormattedMessage defaultMessage='Hiển thị nhiều nơi' />
    },
    {
        value: 2,
        label: <FormattedMessage defaultMessage='Không công khai' />,
        tooltip: <FormattedMessage defaultMessage='Thời gian được lưu mã trước khi sử dụng' />,
    },
];

const OPTIONS_PRODUCT_APPLY = [
    {
        value: 3,
        label: <FormattedMessage defaultMessage='Toàn gian hàng' />
    },
    {
        value: 1,
        label: <FormattedMessage defaultMessage='Một số sản phẩm nhất định' />
    },
];

const OPTIONS_ITEM_TYPE = [
    { value: 1, label: <FormattedMessage defaultMessage='Theo sản phẩm' /> },
    { value: 2, label: <FormattedMessage defaultMessage='Theo hàng hóa' /> },
];

const OPTIONS_TYPE_MARKETING = [
    {
        title: <FormattedMessage defaultMessage='Chiết khấu sản phẩm' />,
        description: <FormattedMessage defaultMessage='Thiết lập các chương trình sản phẩm cho cửa hàng' />,
        type: 'discount',
        sourceIcon: '/media/menu/ic_campaign.svg',
        channels: ['shopee', 'tiktok'],
        basePath: '/marketing/campaign-create-new',
        basePathTemplate: '/marketing/campaign-template-create-new'
    },
    {
        title: <FormattedMessage defaultMessage='Flash Sale' />,
        description: <FormattedMessage defaultMessage='Tạo ưu đãi giới hạn thời gian trong cửa hàng để tăng doanh thu' />,
        type: 'flashsale',
        channels: ['tiktok'],
        sourceIcon: '/media/menu/ic_campaign.svg',
        basePath: '/marketing/campaign-create-new',
        basePathTemplate: '/marketing/campaign-template-create-new'
    },
    {
        title: <FormattedMessage defaultMessage='Mã giảm giá' />,
        description: <FormattedMessage defaultMessage='Mã giảm giá áp dụng cho tất cả hoặc sản phẩm nhất định trong Shop của bạn' />,
        type: 20,
        channels: ['shopee', 'lazada'],
        sourceIcon: '/media/menu/ic_voucher.svg',
        basePath: '/marketing/voucher-create',
        basePathTemplate: '/marketing/voucher-template-create'
    },
    {
        title: <FormattedMessage defaultMessage='Mã giảm giá Livestreams' />,
        description: <FormattedMessage defaultMessage='Mã giảm giá độc quyền áp dụng các sản phẩm trong livestream của Shop' />,
        type: 21,
        channels: ['lazada'],
        sourceIcon: '/media/menu/ic_voucher.svg',
        basePath: '/marketing/voucher-create',
        basePathTemplate: '/marketing/voucher-template-create'
    },
    {
        title: <FormattedMessage defaultMessage='Mã giảm giá theo dõi gian hàng' />,
        description: <FormattedMessage defaultMessage='Tạo mã giảm giá để tăng số lượng người theo dõi Shop' />,
        type: 25,
        channels: ['lazada'],
        sourceIcon: '/media/menu/ic_voucher.svg',
        basePath: '/marketing/voucher-create',
        basePathTemplate: '/marketing/voucher-template-create'
    },
    {
        title: <FormattedMessage defaultMessage='Mã giảm giá riêng tư' />,
        description: <FormattedMessage defaultMessage='Mã giảm giá áp dụng cho nhóm khách hàng' />,
        type: 26,
        channels: ['shopee', 'lazada'],
        sourceIcon: '/media/menu/ic_voucher.svg',
        basePath: '/marketing/voucher-create',
        basePathTemplate: '/marketing/voucher-template-create'
    },
    {
        title: <FormattedMessage defaultMessage='Mua để nhận quà' />,
        description: <FormattedMessage defaultMessage='Mua kèm quà tặng để tăng số lượng đơn hàng' />,
        type: 30,
        channels: ['shopee'],
        sourceIcon: '/media/menu/ic_deal.svg',
        basePath: '/marketing/deal-create',
        basePathTemplate: '/marketing/deal-template-create'
    },
];

const CRITERIA = {
    lazada: {
        firstCriteria: [`- Đánh giá sản phẩm (0.0-5.0): vô hạn`,
            `- Số lượng khuyến mãi: >=1`],
        secondCriteria: [`- Mức độ giảm giá: 1% ~ 90% `,
            `- Đơn hàng 30 ngày trước đó: >=1`]
    },
    shopee: {
        firstCriteria: [`- Số lượng khuyến mãi:1~1000`,
            `- Đánh giá sản phẩm: Không giới hạn`,
            `- Hàng đặt trước: Không chấp nhận hàng đặt trước`,
            `- Thời gian chuẩn bị hàng: Không giới hạn ngày`],
        secondCriteria: [`
      - Mức khuyến mãi: 5% ~ 90%`,
            `- Lượt thích sản phẩm: Không giới hạn`,
            `- Số lượng đơn hàng trong vòng 30 ngày qua: Không giới hạn`,
            `- Thời gian tham gia chương trình tiếp theo: Không giới hạn ngày`]
    },
    tiktok: {
        firstCriteria: [`- Giá thấp nhất trong 30 ngày (Giá ưu đãi chớp nhoáng cần phải thấp hơn giá thấp nhất sau khi sản phẩm của nhà bán hàng giảm giá trong 30 ngày qua. Nếu không có lịch sử đơn hàng nào trong 30 ngày qua, giá ưu đãi chớp nhoáng chỉ cần thấp hơn giá bán lẻ ban đầu.)`],
        secondCriteria: [`- Giá ưu đãi chớp nhoáng sẽ được ưu tiên áp dụng (Khi một sản phẩm được thêm vào cả khuyến mãi ưu đãi chớp nhoáng và khuyến mãi chiết khấu sản phẩm, chỉ có giá ưu đãi chớp nhoáng mới có hiệu lực. Tuy nhiên, khi một sản phẩm ưu đãi chớp nhoáng được đăng ký và phê duyệt cho chiến dịch TikTok, giá chiến dịch sẽ được ưu tiên áp dụng trong suốt chiến dịch, bất kể mức giá này có thấp hơn giá ưu đãi chớp nhoáng hay không.)
      `]
    }
}

const queryGetScProducts = async (ids) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: queryProducts,
        variables: { list_product_id: ids },
        fetchPolicy: "network-only",
    });
    return data?.scGetSmeProductByListId || [];
}

const queryGetScProductVariants = async (ids) => {
    if (ids?.length == 0) return [];

    const { data } = await client.query({
        query: query_scGetProductVariantByIdsForProduct,
        variables: {
            ids: ids,
        },
        fetchPolicy: "network-only",
    });
    return data?.scGetProductVariantByIds.variants || [];
}

const MAX_CAMPAIGN_ITEMS = 100;
const MAX_RANGE_TIME = 20;

const TYPE_CAMPAIGN = {
    1: 'discount',
    2: 'flashsale',
    10: 'other',
}

const BASE_PATH_CAMPAIGN = {
    'voucher': '/marketing/voucher',
    'discount': '/marketing/sale',
    'add_on_deal': '/marketing/deal',
};

const BASE_PATH_CAMPAIGN_TEMPLATE = {
    'voucher': '/marketing/voucher-template',
    'discount': '/marketing/campaign-template',
    'add_on_deal': '/marketing/deal-template',
};

const TYPE_VOUCHER = {
    10: 'Chương trình khác',
    20: 'Mã giảm giá',
    21: 'Mã giảm giá Livestreams',
    25: 'Mã giảm giá theo dõi gian hàng',
    26: 'Mã giảm giá riêng tư',
    22: 'Mã giảm giá Video',
    23: 'Mã giảm giá cho người mua mới',
    24: 'Mã giảm giá Khách hàng mua lại',
    30: 'Mua để nhận quà'
}

export {
    TICK_SVG,
    TABS_DETAILS,
    STATUS_PRODUCTS,
    OPTIONS_TYPE_LIMIT,
    OPTIONS_TYPE_DISCOUNT,
    OPTIONS_ITEM_TYPE,
    MAX_CAMPAIGN_ITEMS,
    MAX_RANGE_TIME,
    CRITERIA,
    TYPE_CAMPAIGN,
    TABS_CAMPAIGN,
    TYPE_VOUCHER,
    OPTIONS_TYPE_VOUCHER,
    STATUS_SALE,
    OPTIONS_CONFIG_DISPLAY,
    OPTIONS_PRODUCT_APPLY,
    OPTIONS_TYPE_MARKETING,
    BASE_PATH_CAMPAIGN,
    BASE_PATH_CAMPAIGN_TEMPLATE,
    queryGetScProducts,
    queryGetScProductVariants
}