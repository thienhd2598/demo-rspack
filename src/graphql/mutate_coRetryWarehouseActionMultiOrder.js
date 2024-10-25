import gql from "graphql-tag";

export default gql`
  mutation coRetryWarehouseActionMultiOrder(
    $list_order_id: [Int!]! = []
  ) {
    coRetryWarehouseActionMultiOrder(list_order_id: $list_order_id) {
      list_fail {
        error_message
        ref_order_id
        order_item_id
      }
      total_fail
      total
      message
      success
    }
  }
`;
