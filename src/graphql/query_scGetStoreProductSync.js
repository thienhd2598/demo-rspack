import gql from "graphql-tag";

export default gql`
  query scGetStoreProductSync($st_sync_status: Int!,
        $st_sync_store_id: Int!,
        $st_sync_type: Int!) {
    scGetStoreProductSync(
        st_sync_status: $st_sync_status ,
        st_sync_store_id: $st_sync_store_id,
        st_sync_type: $st_sync_type,
    ) {
        id
        st_sync_created_at
        st_sync_estimate_time
        st_sync_status
        st_sync_total_product
        st_sync_total_product_processed
        st_sync_type
        total_product_fail
        total_product_success
    }
  }
`;
