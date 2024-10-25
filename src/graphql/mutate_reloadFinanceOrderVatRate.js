import gql from "graphql-tag";

export default gql`
  mutation reloadFinanceOrderVatRate($list_finance_order_id: [Int!]!) {
    reloadFinanceOrderVatRate(list_finance_order_id: $list_finance_order_id) {
      success
      message
    }
  }
`;
