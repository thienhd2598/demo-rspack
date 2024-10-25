import gql from "graphql-tag";

export default gql`
  query warehouse_inventory_transactions_aggregate($where: warehouse_inventory_transactions_bool_exp = {}) {
    warehouse_inventory_transactions_aggregate(where: $where) {
      aggregate {
        count
      } 
    }
  }
`;
