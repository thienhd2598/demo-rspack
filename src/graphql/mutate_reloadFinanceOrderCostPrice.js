import gql from "graphql-tag";

export default gql`
  mutation reloadFinanceOrderCostPrice(
    $list_finance_order_id: [Int!]!
  ) {
    reloadFinanceOrderCostPrice(
        list_finance_order_id: $list_finance_order_id
    ) {
      success
      message
    }
  }
`;
