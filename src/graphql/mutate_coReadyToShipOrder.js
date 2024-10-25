import gql from "graphql-tag";

export default gql`
  mutation coReadyToShipOrder(
    $list_order: [PrepareOrderItem!]! = []
  ) {
    coReadyToShipOrder(list_order: $list_order) {
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
