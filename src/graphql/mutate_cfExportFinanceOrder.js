import gql from "graphql-tag";

export default gql`
  mutation cfExportFinanceOrder(
    $invoice_exported: Int,
    $is_old_order: Int,
    $list_store: [Int!]!,
    $template_id: Int,
    $time_from: Int,
    $time_to: Int,
    $time_type: String,
    $type: Int,
    $abnormal: Int
  ) {
    cfExportFinanceOrder(
      is_old_order: $is_old_order,
      invoice_exported: $invoice_exported,
      list_store: $list_store,
      template_id: $template_id,
      time_from: $time_from,
      time_to: $time_to,
      time_type: $time_type,
      type: $type,
      abnormal: $abnormal
    ) {
        job_tracking_export
        message
        success
    }
  }
`;
