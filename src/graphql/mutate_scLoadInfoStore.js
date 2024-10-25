import gql from "graphql-tag";

export default gql`
  mutation scLoadInfoStore(
    $store_id: Int!
    $connector_channel_code: String!
  ) {
    scLoadInfoStore(
    store_id: $store_id
    connector_channel_code: $connector_channel_code
    ) {
      message
      success
    }
  }
`;
