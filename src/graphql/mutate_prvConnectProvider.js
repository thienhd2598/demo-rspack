import gql from "graphql-tag";

export default gql`
  mutation prvConnectProvider(
    $client_id: String,
    $client_secret: String,
    $provider_code: String!
  ) {
    prvConnectProvider(
        client_id: $client_id,
        client_secret: $client_secret,
        provider_code: $provider_code,
    ) {
      success
      message
    }
  }
`;
