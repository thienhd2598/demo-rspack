import gql from "graphql-tag";

export default gql`
  mutation confirmDeliveryOrder(
    $list_package_id: [Int!]!
    $is_success: Int!,
    $fail_reason: String
  ) {
    confirmDeliveryOrder(
      list_package_id: $list_package_id,
      is_success: $is_success,
      fail_reason: $fail_reason,
    ) {
        list_fail {
            message
            order_ref_id
            order_id
            package_id
            system_package_number
        }
        message
        success
        total_fail
        total_success
    }
  }
`;
