import gql from 'graphql-tag';

export default gql`
query sme_warehouses_aggregate($where: sme_warehouses_bool_exp) {
    sme_warehouses_aggregate(where: $where) {
        aggregate {
            count
        }
  }
}


`;
