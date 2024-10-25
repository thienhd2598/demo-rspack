import gql from "graphql-tag";

export default gql`
query sme_inventory_checklists_by_pk($id: Int!) {
  sme_inventory_checklists_by_pk(id: $id){
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
  }
`;
