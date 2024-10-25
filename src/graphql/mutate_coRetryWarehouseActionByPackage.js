import gql from "graphql-tag";

export default gql`
  mutation coRetryWarehouseActionByPackage($package_id: Int! ) {
    coRetryWarehouseActionByPackage(package_id: $package_id) {
      success
      message
    }
  }
`;
