import gql from 'graphql-tag';

export default gql`
query sc_conversation_stores($status: Int, , $context_channel: String) {
  sc_conversation_stores(status: $status) {
    name
    connector_channel_code
    id
    authorization_expired_at
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
