import gql from "graphql-tag";

export default gql`
  query sme_inventory_export_histories(
    $limit: Int = 10
    $offset: Int = 0
    $order_by: [sme_request_export_inventory_item_locations_order_by!] = { updated_at: desc }
  ) {
    sme_request_export_inventory_item_locations(
      limit: $limit
      offset: $offset
      order_by: $order_by
    ) {
        created_at
        id
        inbound_from
        inbound_to
        path_download
        product_status
        quantity
        sme_id
        status
        updated_at
        warehouse_ids
        real_warehouse_ids
    }
  }
`;
