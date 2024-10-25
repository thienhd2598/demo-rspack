import gql from 'graphql-tag';

export default gql`
    query overview_customer_area {
        overview_customer_area {
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