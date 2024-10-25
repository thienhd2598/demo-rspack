import gql from 'graphql-tag';

export default gql`
mutation scSaleAuthorizationGrant($params: [SaleAuthorizationParams]!, $connector_channel_code: String!) {
  scSaleAuthorizationGrant(connector_channel_code: $connector_channel_code, params: $params) {
    message
    success
  }
}

`;
