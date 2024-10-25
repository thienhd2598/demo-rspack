import gql from "graphql-tag";

export default gql`
  mutation coPrintShipmentPackage(
    $list_package: [ActionPackageItem!]!
    $list_print_type: [Int!]!
    $need_check_shipping_carrier: Int
  ) {
    coPrintShipmentPackage(
        list_package: $list_package
        list_print_type: $list_print_type
        need_check_shipping_carrier: $need_check_shipping_carrier
    ) {
      data {
        doc_url
        html_bbbg
        html_hd
        html_phieu_dong_hang
        html_phieu_tong_hop
        html_phieu_xuat_kho
        list_package_fail {
          error_message
          order_id
          package_id
          system_package_number
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
