import gql from 'graphql-tag';

export default gql`
    query report_customer_area($from: Int!, $type: String!, $channel_code: String, $page: Int, $pageSize: Int) {
        report_customer_area(from: $from, type: $type, channel_code: $channel_code, page: $page, pageSize: $pageSize) {
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