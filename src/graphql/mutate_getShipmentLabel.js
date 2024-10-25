import gql from "graphql-tag";

export default gql`
  mutation getShipmentLabel(
    $list_package_id: [Int!]! = [],
    $connector_channel_code: String!,
    $store_id: Int!
  ) {
    getShipmentLabel(list_package_id: $list_package_id, connector_channel_code: $connector_channel_code, store_id: $store_id) {
      message
      success
    }
  }
`;
