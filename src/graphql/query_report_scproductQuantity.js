import gql from 'graphql-tag';

export default gql`
    query report_scproductQuantity_v2($channel_codes: String, $from: Int!, $store_ids: String, $to: Int!, $page: Int, $pageSize: Int) {
        report_scproductQuantity_v2(channel_codes: $channel_codes,from: $from, to: $to, store_ids: $store_ids, page: $page, pageSize: $pageSize) {
            items {
                count
                increase
                ratio
                scVariantId
            }
            totalPage
        }
    }
`;