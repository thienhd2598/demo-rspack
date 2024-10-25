import gql from 'graphql-tag';

export default gql`
query query_sme_catalog_product_variant_aggregate_sum($where: sme_catalog_product_variant_bool_exp = {}) {
  sme_catalog_product_variant_aggregate(where: $where) {
    aggregate {
      sum {
        price
        cost_price
      }
    }
  }
}



`;
