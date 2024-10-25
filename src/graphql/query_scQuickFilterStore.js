import gql from 'graphql-tag';

export default gql`
query scQuickFilterStore {
  scQuickFilterStore {
    loaded {
      total_processed
      total_store
      total_product
    }
    ready_sync {
      total_processed
      total_product
      total_store
    }
    syncing {
      total_processed
      total_product
      total_store
    }
  }
}


`;
