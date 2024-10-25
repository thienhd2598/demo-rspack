import gql from 'graphql-tag';

export default gql`
    query overview_charts {
        overview_charts {
            color
            data {
                label
                time
                value
            }
            defaultSelected
            description
            increase
            prevData {
                label
                time
                value
            }
            title
            tooltip
            unit
            value
        }
    }
`