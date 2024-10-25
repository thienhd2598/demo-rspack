import gql from 'graphql-tag';

export default gql`
    query report_productSoldScByGMV($channel_codes: String, $from: Int!, $store_ids: String, $to: Int!, $limit: Int) {
        report_productSoldScByGMV(channel_codes: $channel_codes,from: $from, to: $to, store_ids: $store_ids, limit: $limit) {
            scVariantId
            value
            productId
            variantName
        }
    }
`