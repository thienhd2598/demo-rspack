import gql from "graphql-tag";

export default gql`
  mutation processFinanceOrderLowPrice($list_finance_order_id: [Int!]!) {
    processFinanceOrderLowPrice(list_finance_order_id: $list_finance_order_id) {
        message
        success
    }
  }
`;