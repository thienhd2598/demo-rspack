import gql from "graphql-tag";

export default gql`
  mutation coRetryWarehouse($order_item_id: Int! ) {
    coRetryWarehouseAction(order_item_id: $order_item_id) {
      success
      message
    }
  }
`;
