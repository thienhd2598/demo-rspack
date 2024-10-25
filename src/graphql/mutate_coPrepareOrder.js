import gql from "graphql-tag";

export default gql`
  mutation coPrepareOrder(
    $delivery_method: Int
    $list_order: [PrepareOrderItem!]! = []
  ) {
    coPrepareOrder(delivery_method: $delivery_method, list_order: $list_order) {
      data {
        doc_url
        list_order_fail {
          error_message
          order_id
          ref_order_id
        }
        total_fail
        total_success
      }
      message
      success
    }
  }
`;
