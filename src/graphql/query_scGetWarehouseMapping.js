import gql from 'graphql-tag';

export default gql`
    query scGetWarehouseMapping($store_id: Int) {
        scGetWarehouseMapping(store_id: $store_id) {
            id
            inventory_push_percent
            inventory_push_rule_type
            sc_store_type
            sc_warehouse_id
            sme_warehouse_id
            store_id
            updated_at
            storeChannel {
                id
                name
                percent_sync_up
            }
            scWarehouse {
                address
                city
                created_at
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
                    id
                    connector_channel_code
                    has_sync_warehouse
                    enable_multi_warehouse
                    name
                }
            }        
        }
    }
`;