import gql from 'graphql-tag';

export default gql`
    mutation scUpdateStore($store_id: Int!, $special_type: Int, $is_product_link_auto: Int, $merge_stock: Int, $merge_price: Int, $percent_sync_up: Int, $is_custom_label: Int) {
        scUpdateStore(store_id: $store_id, special_type: $special_type, merge_stock: $merge_stock, merge_price: $merge_price, percent_sync_up: $percent_sync_up, is_product_link_auto: $is_product_link_auto, is_custom_label: $is_custom_label) {
            success
            message
        }
    }
`;