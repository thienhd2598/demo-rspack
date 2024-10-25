import gql from "graphql-tag";

export default gql`
  query summarySettlementOrder($store_id: Int, $payment_system: String,$connector_channel_code: String!, $is_old_order: Int,) {
    summarySettlementOrder(store_id: $store_id, payment_system: $payment_system, connector_channel_code: $connector_channel_code, is_old_order: $is_old_order) {
      sum_abnormal
      sum_pending
      sum_processed_month
      sum_processed_week
      total_order_abnormal
      count_pending
      count_processed
    }
  }
`;
