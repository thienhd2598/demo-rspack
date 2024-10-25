import gql from 'graphql-tag';

export default gql`
query sc_stores_raw {
  sc_stores {
    connector_channel_code
    country_code
    created_at
    is_cb
    id
    last_connected_at
    name
    payload
    ref_shop_id
    status
    updated_at
    productSyncJobs {
      id
      st_sync_created_at
      st_sync_estimate_time
      st_sync_status
      st_sync_total_product
      st_sync_total_product_processed
      st_sync_type
    }
    activeProductSyncJob {
      id
      st_sync_created_at
      st_sync_estimate_time
      st_sync_status
      st_sync_total_product_processed
      st_sync_total_product
      st_sync_type
    }
  }
  op_connector_channels {
    code
    id
    logo_asset_id
    logo_asset_url
    name
    enable_logistic
  }
}

`;
