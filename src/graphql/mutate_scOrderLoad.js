import gql from "graphql-tag";

export default gql`
  mutation scOrderLoad(
    $store_id: Int!
    $ref_shop_id: String!
    $connector_channel_code: String!
    $time_range_field: String!
    $time_from: Int!
    $time_to: Int!
  ) {
    scOrderLoad(
      store_id: $store_id
      ref_shop_id: $ref_shop_id
      connector_channel_code: $connector_channel_code
      time_range_field: $time_range_field
      time_from: $time_from
      time_to: $time_to
    ) {
      message
      success
      total_order
    }
  }
`;
