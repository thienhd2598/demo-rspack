import gql from "graphql-tag";

export default gql`
  mutation crmExportCustomer(
    $list_channel: [String],
    $list_store: [Int],
    $list_tag: [Int],
    $range_time: [Int]
  ) {
    crmExportCustomer(
        list_channel: $list_channel
        list_store: $list_store
        list_tag: $list_tag        
        range_time: $range_time
    ) {
        job_tracking_export_order
        message
        success
    }
  }
`;
