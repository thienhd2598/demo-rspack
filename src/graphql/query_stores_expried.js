import gql from 'graphql-tag';

export default gql`
query query_stores_expried {
  sc_stores {
    connector_channel_code
    name
    id
    authorization_expired_at
    status
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
