import gql from 'graphql-tag';

export default gql`
    query report_productSoldScByQuantity($channel_codes: String, $from: Int!, $store_ids: String, $to: Int!) {
        report_productSoldScByQuantity(channel_codes: $channel_codes,from: $from, to: $to, store_ids: $store_ids) {
            scVariantId
            value
            variantName
        }
    }
`