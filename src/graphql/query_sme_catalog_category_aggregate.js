import gql from 'graphql-tag';

export default gql`
query sme_catalog_category_aggregate($where: sme_catalog_category_bool_exp = {}) {
    sme_catalog_category_aggregate(where: $where) {
      aggregate {
        count
      }
    }
    
  }
`;