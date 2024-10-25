import gql from 'graphql-tag';

export default gql`
query verify_public_summary($from_date: Int, $store_id: [Int], $to_date: Int) {
  verify_public_summary(from_date: $from_date, to_date: $to_date, store_id: $store_id) {
    finance_order_total_invalid
    finance_order_total_valid
    order_sync_total_invalid
    order_sync_total_valid
    outbound_inbound_total_invalid
    outbound_inbound_total_valid
    return_order_total_invalid
    return_order_total_valid
    settlement_payout_total_invalid
    settlement_payout_total_valid
    settlement_sync_total_invalid
    settlement_sync_total_valid
  }
}
`