import gql from "graphql-tag";

export default gql`
  mutation coPreparePackage(
    $delivery_method: Int
    $list_package:  [ActionPackageItem!]! = []
  ) {
    coPreparePackage(delivery_method: $delivery_method, list_package: $list_package) {
      data {
        doc_url
        list_package_fail {
          error_message
          package_id
          order_id
          ref_order_id
          system_package_number
        }
        total_fail
        total_success
      }
      message
      success
    }
  }
`;
