import gql from 'graphql-tag';

export default gql`    
query cfExportSettlementAggregate(
    $list_store: [ScStoreDataInput!]!,
    $settlement_abnormal: Int,
    $payment_system: String,
    $is_old_order: Int,
    $time_from: Int,
    $time_to: Int,
    $type: Int,
) {
    cfExportSettlementAggregate(
        list_store: $list_store
        payment_system: $payment_system
        settlement_abnormal: $settlement_abnormal
        is_old_order: $is_old_order
        time_from: $time_from
        time_to: $time_to
        type: $type
    ){
        count
  }
}
`;