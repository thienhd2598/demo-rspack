import gql from 'graphql-tag';

export default gql`
query sme_catalog_product_aggregate($where: sme_catalog_product_bool_exp!) {
  sme_catalog_product_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}

`;
