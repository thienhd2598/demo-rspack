import gql from 'graphql-tag';

export default gql`
    query report_smeproductQuantity_v2($channel_codes: String, $from: Int!, $store_ids: String, $to: Int!, $warehouses_ids: String, $page: Int, $pageSize: Int) {
        report_smeproductQuantity_v2(channel_codes: $channel_codes,from: $from, to: $to, store_ids: $store_ids, warehouses_ids: $warehouses_ids, page: $page, pageSize: $pageSize) {
            totalPage
            items {
                count
                increase
                variantId
                ratio
            }
        }
    }
`;