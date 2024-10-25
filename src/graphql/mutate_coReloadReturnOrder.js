import gql from "graphql-tag";

export default gql`
  mutation coReloadReturnOrder(
    $list_return_order_id: [Int!]!
  ) {
    coReloadReturnOrder(
      list_return_order_id: $list_return_order_id
    ) {
      success
      message
    }
  }
`;
