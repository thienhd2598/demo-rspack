import gql from 'graphql-tag';

export default gql`
mutation mutate_scProductSyncUp_raw($sme_product_id: String!, $products: [Int] = []) {
  scProductSyncUp(sme_product_id: $sme_product_id, products: $products) {
    message
    success
    total_product
  }
}

`;
