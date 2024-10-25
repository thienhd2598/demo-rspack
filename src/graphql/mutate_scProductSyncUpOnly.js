import gql from 'graphql-tag';

export default gql`

mutation scProductSyncUpOnly($products: [Int!] = []) {
  scProductSyncUpOnly(products: $products) {
    message
    success
    total_product
  }
}

`;
