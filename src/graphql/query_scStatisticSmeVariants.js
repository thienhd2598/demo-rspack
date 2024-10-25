import gql from 'graphql-tag';

export default gql`
  query scStatisticSmeVariants($q: String = "", $store_id: Int = null) {
    scStatisticSmeVariants(q: $q, store_id: $store_id) {
      total_variant
      connector_channel_code
      group {
        count_linked
        count_not_link
        total
      }
    }
}
`;
