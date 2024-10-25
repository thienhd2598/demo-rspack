import gql from 'graphql-tag';

export default gql`

mutation scCloneStoreProduct($allow_duplicate: Int!, $clone_product_type: Int!, $from_store_id: Int!, $sync_up: Int!, $to_store_ids: [Int!]) {
  scCloneStoreProduct(allow_duplicate: $allow_duplicate, clone_product_type: $clone_product_type, from_store_id: $from_store_id, sync_up: $sync_up, to_store_ids: $to_store_ids) {
    message
    success
  }
}
`;
