import gql from 'graphql-tag';

export default gql`
mutation scProductSyncUp($sme_product_id: String!, $merge_flags: ScMergeFlags = {}) {
  scProductSyncUp(sme_product_id: $sme_product_id, merge_flags: $merge_flags) {
    message
    success
    total_product
  }
}


`;
