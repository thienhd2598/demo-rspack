import gql from 'graphql-tag';

export default gql`
query scStatisticUpbaseSmeProducts ($q: String = "", $store_id: Int = null) {
  scStatisticUpbaseSmeProducts (q: $q, store_id: $store_id) {
    total
    total_error
    total_synced
    total_syncing
  }
}

`;
