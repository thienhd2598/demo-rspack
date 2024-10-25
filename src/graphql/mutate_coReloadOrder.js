import gql from "graphql-tag";

export default gql`
  mutation coReloadOrder(
    $list_sc_order_id: [Int!]!
  ) {
    coReloadOrder(
      list_sc_order_id: $list_sc_order_id
    ) {
      success
      message
    }
  }
`;
