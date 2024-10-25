import gql from "graphql-tag";

export default gql`
  query sme_inventory_export_histories(
    $limit: Int = 10
    $offset: Int = 0
    $order_by: [sme_inventory_export_histories_order_by!] = { updated_at: desc }
  ) {
    sme_inventory_export_histories(
      limit: $limit
      offset: $offset
      order_by: $order_by
    ) {
      created_at
      id
      path_download
      product_status
      product_type
      quantity
      sme_id
      status
      updated_at
      warehouse_ids
    }
  }
`;
