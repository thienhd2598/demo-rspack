import gql from 'graphql-tag';

export default gql`
    mutation userImportUpdateCostPrice($url: String!) {
        userImportUpdateCostPrice(url: $url) {
            message
            success
        }
    }   
`