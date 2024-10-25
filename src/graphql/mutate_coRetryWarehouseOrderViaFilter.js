import gql from "graphql-tag";

export default gql`
  mutation coRetryWarehouseOrderViaFilter(
    $search: SearchOrder
  ) {
    coRetryWarehouseOrderViaFilter(search: $search) {
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
