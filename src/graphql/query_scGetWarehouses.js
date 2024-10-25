import gql from 'graphql-tag';

export default gql`
    query scGetWarehouses($store_id: Int) {
        scGetWarehouses(store_id: $store_id) {
            address
            city
            created_at
            district
            id
            is_default
            region
            state
            status
            store_id
            updated_at
            warehouse_id
            warehouse_name
            warehouse_type
            storeChannel {
                connector_channel_code
                authorization_expired_at
                country_code
                created_at
                enable_multi_warehouse
                has_sync_warehouse
                id
                name
                inventory_limit
                is_product_link_auto
                is_cb
                last_connected_at
                status
                sme_id
                ref_shop_id
            }
        }
    }
`;