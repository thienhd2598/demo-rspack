import gql from 'graphql-tag';

export default gql`
    query report_scproductGMV_v2($channel_codes: String, $from: Int!, $store_ids: String, $to: Int!, $page: Int, $pageSize: Int) {
        report_scproductGMV_v2(channel_codes: $channel_codes,from: $from, to: $to, store_ids: $store_ids, page: $page, pageSize: $pageSize) {
            items {
                increase
                ratio
                scVariantId
                totalPaid
            }
            totalPage
        }
    }
`;