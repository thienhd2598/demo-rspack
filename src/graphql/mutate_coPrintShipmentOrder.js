import gql from "graphql-tag";

export default gql`
  mutation coPrintShipmentOrder(
    $list_order: [PrepareOrderItem!]! = []
    $list_print_type: [Int!]! = []
  ) {
    coPrintShipmentOrder(
      list_order: $list_order
      list_print_type: $list_print_type
    ) {
      success
      message
      data {
        html_bbbg
        html_phieu_xuat_kho
        html_phieu_tong_hop
        html_phieu_dong_hang
        html_hd
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
