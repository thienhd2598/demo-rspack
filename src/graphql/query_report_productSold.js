import gql from 'graphql-tag';

export default gql`
    query report_productSold($status: Int!, $from: Int!, $store_id: Int, $to: Int!, $channel_code: String, $channel_codes: String, , $store_ids: String, ) {
        report_productSold(status: $status,from: $from, to: $to, store_id: $store_id, channel_code: $channel_code, channel_codes: $channel_codes, store_ids: $store_ids) {
            productId
            soldCount
            storeCount
        }
    }
`