import gql from "graphql-tag";

export default gql`
  query warehouse_inventory_export_histories(
    $limit: Int = 10
    $offset: Int = 0
    $order_by: [warehouse_inventory_export_histories_order_by!] = { created_at: desc }
  ) {
    warehouse_inventory_export_histories(
      limit: $limit
      offset: $offset
      order_by: $order_by
    ) {
        created_at
        from
        id
        path_download
        quantity
        sme_id
        status
        to
        warehouse_id
    }
    warehouse_inventory_export_histories_aggregate {
      aggregate {
        count
      }
    }
  }
`;
