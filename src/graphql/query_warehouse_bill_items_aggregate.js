import gql from "graphql-tag";

export default gql`
  query warehouse_bill_items_aggregate($where: warehouse_bill_items_bool_exp = {}) {
    warehouse_bill_items_aggregate(where: $where) {
        aggregate {
        count
        }
    }
  }
`;
