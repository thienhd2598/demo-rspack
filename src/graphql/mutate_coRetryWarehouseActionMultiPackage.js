import gql from "graphql-tag";

export default gql`
  mutation coRetryWarehouseActionMultiPackage($list_package_id: [Int!]) {
    coRetryWarehouseActionMultiPackage(list_package_id: $list_package_id) {
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
