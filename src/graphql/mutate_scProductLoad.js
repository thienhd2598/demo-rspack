import gql from 'graphql-tag';

export default gql`
mutation scProductLoad($store_id: Int!) {
  scProductLoad(store_id: $store_id) {
    message
    success
    total_product
  }
}

`;
