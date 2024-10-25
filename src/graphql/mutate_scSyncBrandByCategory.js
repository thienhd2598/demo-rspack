import gql from "graphql-tag";

export default gql`
  mutation scSyncBrandByCategory(
    $connector_channel_code: String!
    $list_category_id: [Int!]!
    $store_id: Int!
  ) {
    scSyncBrandByCategory(
      connector_channel_code: $connector_channel_code
      list_category_id: $list_category_id      
      store_id: $store_id
    ) {
      success
      tracking_id
      message
    }
  }
`;
