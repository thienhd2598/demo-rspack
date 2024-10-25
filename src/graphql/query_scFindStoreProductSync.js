import gql from "graphql-tag";

export default gql`
  query scFindStoreProductSync($id: Int!) {
    scFindStoreProductSync(id: $id) {
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
