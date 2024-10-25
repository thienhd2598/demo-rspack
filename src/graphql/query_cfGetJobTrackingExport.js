import gql from "graphql-tag";

export default gql`
  query cfGetJobTrackingExport(
    $page: Int!
    $per_page: Int!
    $type: Int
  ) {
    cfGetJobTrackingExport(
      page: $page
      per_page: $per_page
      type: $type
    ) {
      job_tracking_export {
        created_at
        file_name
        id
        language
        link_file_export
        list_store
        settlement_abnormal
        sme_id
        status
        time_from
        params_payload
        time_to
        templateExport {
          name
        }
        total_order_settlement
        type
        updated_at
      }
      total
    }
  }
`;
