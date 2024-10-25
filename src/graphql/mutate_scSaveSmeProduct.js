import gql from 'graphql-tag';

export default gql`
mutation scSaveSmeProduct($sme_products: [SmeProduct!]!, $list_product_id: [Int!] = []) {
  scSaveSmeProduct(sme_products: $sme_products) {
    success
    message
  }
  scProductRemoveOnStore(action_type: 2, list_product_id: $list_product_id) {
    success
    message
  }
}
`;
