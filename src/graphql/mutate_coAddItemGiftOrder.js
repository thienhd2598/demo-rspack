import gql from "graphql-tag";

export default gql`
  mutation coAddItemGiftOrder(
    $list_item_gift:  [ItemGift],
    $package_id: Int, 
    $sme_warehouse_id: Int) {
    coAddItemGiftOrder(
      list_item_gift: $list_item_gift, 
      package_id: $package_id, 
      sme_warehouse_id: $sme_warehouse_id
    ) {
      message
      success
    }
  }
`;
