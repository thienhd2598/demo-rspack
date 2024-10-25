import gql from 'graphql-tag';

export default gql`
    query overview_customer {
        overview_customer {
            data {
                color
                label
                time
                value
              }
            title
        }
    }
`