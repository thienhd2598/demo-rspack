import gql from "graphql-tag";

export default gql`
  query warehouse_bills_aggregate($where: warehouse_bills_bool_exp = {}) {
    warehouse_bills_aggregate(where: $where) {
      aggregate {
        count
      } 
    }
  }
`;
