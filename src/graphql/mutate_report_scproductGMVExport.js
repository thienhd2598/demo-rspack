import gql from 'graphql-tag';

export default gql`

mutation report_scproductGMVExport($channel_codes: String, $from: Int!, $store_ids: String, $to: Int!) {
    report_scproductGMVExport(from: $from, to: $to, store_ids: $store_ids, channel_codes: $channel_codes) {
        data
        message
        success
    }
}
`;