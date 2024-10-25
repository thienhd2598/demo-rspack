import gql from "graphql-tag";

export default gql`
  mutation cfExportOrderSettlement(
    $is_old_order: Int,
    $payment_system: String,
    $list_store: [ScStoreDataInput!]!,
    $settlement_abnormal: Int,
    $time_from: Int,
    $time_to: Int,
    $type: Int
  ) {
    cfExportOrderSettlement(
      list_store: $list_store
      payment_system: $payment_system
      settlement_abnormal: $settlement_abnormal
      is_old_order: $is_old_order
      time_from: $time_from
      time_to: $time_to
      type: $type
    ) {
        job_tracking_export
        message
        success
    }
  }
`;
