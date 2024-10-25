import gql from 'graphql-tag';

export default gql`
query query_stores_channel($context: String) {
    sc_stores(context: $context) {
      country_code
      connector_channel_code
      id
      authorization_expired_at
      last_connected_at
      last_disconnected_at
      name      
      ref_shop_id
      status
      total_product
      total_product_loaded
      total_product_synced
      payload
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
