import gql from 'graphql-tag';

export default gql`
    query sc_stores_warehouse {
        sc_stores {
            connector_channel_code
            country_code
            created_at
            is_cb
            id
            last_connected_at
            name
            payload
            is_product_link_auto      
            ref_shop_id
            enable_multi_warehouse
            merge_price
            has_sync_warehouse
            merge_stock
            status
            updated_at
            percent_sync_up
            productSyncJobs {
                id
                st_sync_created_at
                st_sync_estimate_time
                st_sync_status
                st_sync_total_product
                st_sync_total_product_processed
                st_sync_type
            }
            activeProductSyncJob {
                id
                st_sync_created_at
                st_sync_estimate_time
                st_sync_status
                st_sync_total_product_processed
                st_sync_total_product
                st_sync_type
            }
            total_product
            total_product_loaded
            type_push_inventory
            total_product_synced            
        }  
        
        op_connector_channels {
            code
            id
            logo_asset_id
            logo_asset_url
            name
            enable_logistic
        }
    }
`;
