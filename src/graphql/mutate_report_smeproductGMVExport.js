import gql from 'graphql-tag';

export default gql`
mutation report_smeproductGMVExport($channel_codes: String, $from: Int!, $store_ids: String, $to: Int!, $warehouses_ids: String) {
  report_smeproductGMVExport(from: $from, to: $to, store_ids: $store_ids, channel_codes: $channel_codes, warehouses_ids: $warehouses_ids) {
    data
    message
    success
  }
}
`;