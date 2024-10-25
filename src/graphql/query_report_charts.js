import gql from 'graphql-tag';

export default gql`
    query report_charts($from: Int!, $store_id: Int, $to: Int!, $status: Int!, $type: String!, $channel_code: String, $channel_codes: String, $store_ids: String, $last_type: String = "", $source: String) {
        report_charts(from: $from, to: $to, status: $status, store_id: $store_id, type: $type, channel_code: $channel_code, channel_codes: $channel_codes, store_ids: $store_ids, last_type: $last_type, source: $source) {
            data {
                label
                time
                value
              }
            color
            description
            defaultSelected
            unit
            increase
            title
            tooltip
            value   
        }
    }
`