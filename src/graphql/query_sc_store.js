import gql from 'graphql-tag';

export default gql`
query sc_store($id: Int!, $skip: Boolean = false) {
  sc_store(id: $id) @skip(if: $skip) {
    connector_channel_code
    country_code
    created_at
    is_cb
    is_custom_label
    id
    last_connected_at
    name
    payload
    ref_shop_id
    special_type
    company_name
    description
    email
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
    total_product
    total_product_loaded
    total_product_synced
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
