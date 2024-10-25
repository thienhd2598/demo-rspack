import gql from 'graphql-tag';

export default gql`
    mutation scConfigSyncWarehouseStore($store_id: Int!, $enable_sync_wh: Int!) {
        scConfigSyncWarehouseStore(store_id: $store_id, enable_sync_wh: $enable_sync_wh) {
            success
            message
        }
    }
`;