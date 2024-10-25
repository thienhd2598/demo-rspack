import gql from 'graphql-tag';

export default gql`
    query report_ratio($from: Int!, $store_id: Int, $to: Int!, $status: Int!, $channel_code: String, $channel_codes: String, $store_ids: String, $last_type: String) {
        report_ratio(from: $from, to: $to, status: $status, store_id: $store_id, channel_code: $channel_code, channel_codes: $channel_codes, store_ids: $store_ids, last_type: $last_type) {
            data {
                label
                time
                value
            }
            title   
        }
    }
`