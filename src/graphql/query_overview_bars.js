import gql from 'graphql-tag';

export default gql`
    query overview_bars {
        overview_bars {
            data {
                label
                time
                value
            }
            title
        }
    }
`