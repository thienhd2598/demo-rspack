import gql from "graphql-tag";

export default gql`
  mutation processSettlement($list_abnormal: [SettlementAbnormalItem!]!) {
    processSettlementAbnormal(list_abnormal: $list_abnormal) {
      list_error {
        message
        order_ref_id
        settlement_id
      }
      message
      success
      total
      total_error
    }
  }
`;
