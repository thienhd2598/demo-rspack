import gql from 'graphql-tag';

export default gql`
    query report_customers($from: Int!, $type: String!, $channel_code: String) {
        report_customers(from: $from, type: $type, channel_code: $channel_code) {
            data {
                color
                label
                time
                value
                value2
              }
            title
            total
            total2
        }
    }
`