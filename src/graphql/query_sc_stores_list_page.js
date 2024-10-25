import gql from 'graphql-tag';

export default gql`
query sc_stores($per_page: Int = 1000, $page: Int = 1, $filter_type: Int = 2, $status: Int) {
  scStoreByFilter(filter_type: $filter_type, page: $page, per_page: $per_page, status: $status) {
    stores {
      country_code
      connector_channel_code
      id
      last_connected_at
      last_disconnected_at
      name      
      ref_shop_id
      status
      total_product
      total_product_loaded
      total_product_synced
      has_sync_down_error
      payload
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
