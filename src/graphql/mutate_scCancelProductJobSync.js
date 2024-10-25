import gql from 'graphql-tag';

export default gql`

mutation scCancelProductJobSync($sc_product_sync_id: Int!) {
  scCancelProductJobSync(sc_product_sync_id: $sc_product_sync_id) {
    message
    success
  }
}
`;
