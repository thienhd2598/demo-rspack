import gql from 'graphql-tag';

export default gql`
query sme_catalog_product_variant_aggregate($where:  sme_catalog_product_variant_bool_exp = {}) {
  sme_catalog_product_variant_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}

`;
