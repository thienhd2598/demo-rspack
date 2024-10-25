import gql from 'graphql-tag';

export default gql`
query query_sc_stores_basic ($context: String, $context_channel: String) {
  sc_stores (context: $context) {
    connector_channel_code
    name
    id
    authorization_expired_at
    enable_multi_warehouse
    status
    merge_stock
    special_type
    ref_shop_id
  }
  op_connector_channels (context: $context_channel) {
    code
    id
    payment_system
    logo_asset_id
    logo_asset_url
    name
  }
}

`;
