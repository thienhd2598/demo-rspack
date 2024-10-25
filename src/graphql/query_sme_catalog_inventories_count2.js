import gql from 'graphql-tag';

export default gql`
query sme_catalog_inventories_aggregate_count2($where: sme_catalog_inventories_bool_exp = {}) {
  
  sme_catalog_inventories_aggregate(where: $where) {
    aggregate {
      count
      sum {
        stock_actual
      }
    }
  }
}



`;
