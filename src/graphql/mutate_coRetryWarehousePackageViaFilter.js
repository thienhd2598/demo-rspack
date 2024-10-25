import gql from "graphql-tag";

export default gql`
  mutation coRetryWarehousePackageViaFilter($search: SearchPackage) {
    coRetryWarehousePackageViaFilter(search: $search) {
        list_fail {
            error_message
            order_item_id
            package_id
            ref_order_id
            system_package_number
        }
        message
        success
        total
        total_fail
    }
  }
`;
