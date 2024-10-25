import gql from 'graphql-tag';

export default gql`
mutation scSaleAuthorizationCancel($store_id: Int!) {
  scSaleAuthorizationCancel(store_id: $store_id) {
    message
    success
  }
}

`;
