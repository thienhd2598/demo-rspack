import gql from 'graphql-tag';

export default gql`
query sc_stores($per_page: Int = 1000, $page: Int = 1, $filter_type: Int = 2, $status: Int) {
  scStoreByFilter(filter_type: $filter_type, page: $page, per_page: $per_page, status: $status) {
    stores {
      connector_channel_code
      country_code
      created_at
      has_sync_warehouse
      id
      last_connected_at
      last_disconnected_at
      name      
      payload
      ref_shop_id
      is_product_link_auto
      status
      merge_price
      merge_stock
      updated_at
      # product_linked
      # variant_linked
      # sum_variant
      # sum_total_product
      percent_sync_up
      productSyncJobs {
        id
        st_sync_created_at
        st_sync_estimate_time
        st_sync_status
        st_sync_total_product
        st_sync_total_product_processed
        st_sync_type
      }
      total_product
      total_product_loaded
      total_product_synced
      has_sync_down_error
    }
    total
  }
  op_connector_channels {
    code
    id
    logo_asset_id
    logo_asset_url
    name
  }
}

`;
