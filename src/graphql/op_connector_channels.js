import gql from 'graphql-tag';

export default gql`
query op_connector_channels ($context: String) {
  op_connector_channels (context: $context) {
    code
    id
    logo_asset_id
    logo_asset_url
    name
  }
}
`;
