import gql from "graphql-tag";

export default gql`
  query co_get_tracking_load_order($id: Int!) {
    co_get_tracking_load_order(
      id: $id
    ) {
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
`;
