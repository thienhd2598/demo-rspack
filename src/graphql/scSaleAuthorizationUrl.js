import gql from 'graphql-tag';

export default gql`
query scSaleAuthorizationUrl($connector_channel_code: String!) {
  scSaleAuthorizationUrl(connector_channel_code: $connector_channel_code) {
    authorization_url
  }
}

`;
