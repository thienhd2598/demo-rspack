import gql from "graphql-tag";

export default gql`
  mutation coReadyToShipPackage(
    $list_package: [ActionPackageItem!]! = [],
    $need_check_shipping_carrier: Int
  ) {
    coReadyToShipPackage(list_package: $list_package, need_check_shipping_carrier: $need_check_shipping_carrier) {
      data {
        doc_url
        list_package_fail {
          package_id
          error_message
          order_id
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
