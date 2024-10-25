import gql from "graphql-tag";

export default gql`
  query scGetTrackingLoadOrder($list_store_id: [Int] $type: Int) {
    scGetTrackingLoadOrder(
      list_store_id: $list_store_id 
      type: $type
    ) {
      total
      trackingLoadOrder {
        id
        sme_id
        store_id
        total_job_load
        total_job_load_processed
        total_order
        start_time
        finish_time
        sync_error
        total_order_success
        total_order_fail
        type
      }
    }
  }
`;
