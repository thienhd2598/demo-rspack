import gql from "graphql-tag";

export default gql`
  query scFindWarehouse($id: Int!) {
    scFindWarehouse(id: $id) {
        address
        city
        created_at
        district
        id
        is_default
        region
        state
        status
        store_id
        updated_at
        warehouse_id
        address_id
        warehouse_name
        warehouse_type
    }
  }
`;
