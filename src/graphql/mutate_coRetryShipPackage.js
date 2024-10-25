import gql from "graphql-tag";

export default gql`
  mutation coRetryShipPackage($list_package: [ActionPackageItem!]!) {
    coRetryShipPackage(list_package: $list_package) {
        data {
        html_bbbg
        doc_url
        html_hd
        html_phieu_dong_hang
        html_phieu_tong_hop
        html_phieu_xuat_kho
        total_fail
        total_success
        list_package_fail {
          error_message
          order_id
          package_id
          ref_order_id
          system_package_number
        }
      }
      message
      success
    }
  }
`;
