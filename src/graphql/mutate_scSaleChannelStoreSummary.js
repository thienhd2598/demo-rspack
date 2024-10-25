import gql from 'graphql-tag';

export default gql`
    mutation scSaleChannelStoreSummary($list_store_id: [Int!]) {
        scSaleChannelStoreSummary(list_store_id: $list_store_id) {
            success
            message
            data{
                product_linked
                store_id
                sum_total_product
                sum_variant
                variant_linked
            }
        }
    }
`;