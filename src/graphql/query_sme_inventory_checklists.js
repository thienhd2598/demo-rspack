import gql from "graphql-tag";

export default gql`
  query sme_inventory_checklists(
    $limit: Int = 10
    $offset: Int = 0
    $where: sme_inventory_checklists_bool_exp = {}
  ) {
    sme_inventory_checklists(limit: $limit, offset: $offset, where: $where, order_by: [{updated_at: desc}]) {
      code
      created_at
      id
      sme_id
      sme_warehouse_id
      status
      type
      updated_at
      items_aggregate {
        aggregate {
          count
        }
      }
    }
    sme_inventory_checklists_aggregate(where: $where) {
            aggregate {
                count
            }
        }
  }
`;
