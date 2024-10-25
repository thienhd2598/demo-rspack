import gql from 'graphql-tag';

export default gql`
mutation scHandleSmeProductDeleted($list_sme_product_id: [String] = "", $list_sme_variant_id: [String] = "") {
  scHandleSmeProductDeleted(list_sme_variant_id: $list_sme_variant_id, list_sme_product_id: $list_sme_product_id) {
    message
    success
  }
}

`;