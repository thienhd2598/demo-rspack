import gql from "graphql-tag";

export default gql`
  mutation coDeleteItemGiftOrder(
    $list_item_id:  [Int], $order_id: Int)
    { coDeleteItemGiftOrder(
      list_item_id: $list_item_id,
      order_id: $order_id 
    ) {
      message
      success
    }
  }
`;
