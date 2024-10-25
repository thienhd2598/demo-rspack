import gql from "graphql-tag";

export default gql`
  mutation coReloadProductStock(
    $order_id: Int!
  ) {
    coReloadProductStock(
      order_id: $order_id
    ) {
      success
      message
    }
  }
`;
