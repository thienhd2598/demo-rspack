import gql from 'graphql-tag';

export default gql`    
query cfExportFinanceOrderAggregate(
    $is_old_order: Int,
    $invoice_exported: Int,
    $list_store: [Int!]!,
    $time_from: Int,
    $time_to: Int,
    $time_type: String,
    $type: Int,
    $abnormal: Int
) {
    cfExportFinanceOrderAggregate(
        is_old_order: $is_old_order,
        invoice_exported: $invoice_exported,
        list_store: $list_store,
        time_from: $time_from,
        time_to: $time_to,
        time_type: $time_type,
        type: $type,
        abnormal: $abnormal
    ){
        count
  }
}
`;