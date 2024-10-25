import gql from "graphql-tag";

export default gql`
  query warehouse_reserve_tickets_aggregate($where: warehouse_reserve_tickets_bool_exp = {}) {
    warehouse_reserve_tickets_aggregate(where: $where) {
      aggregate {
        count
      } 
    }
  }
`;
