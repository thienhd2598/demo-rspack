import gql from "graphql-tag";

export default gql`
  mutation coActionOrderViaFilter(
    $action_type: Int!
    $address_id: Int
    $delivery_method: Int
    $pickup_time_id: String
    $list_print_type: [Int]
    $search: SearchOrder
  ) {
    coActionOrderViaFilter(
      action_type: $action_type
      address_id: $address_id
      delivery_method: $delivery_method
      pickup_time_id: $pickup_time_id
      search: $search
      list_print_type: $list_print_type
    ) {
      success
      message
      total_remaining
      data {
        html_bbbg
        html_phieu_xuat_kho
        html_phieu_tong_hop
        html_phieu_dong_hang
        doc_url
        total_success
        total_fail
        list_order_fail {
          error_message
          order_id
          ref_order_id
        }
      }
    }
  }
`;
