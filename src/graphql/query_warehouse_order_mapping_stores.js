import gql from "graphql-tag";

export default gql`
  query warehouse_order_mapping_stores($where: warehouse_order_mapping_stores_bool_exp={}) {
  warehouse_order_mapping_stores(where: $where) {
    order_id
    warehouse {
      id
      name
    }
  }
}
`;

