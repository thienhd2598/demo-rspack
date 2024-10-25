import gql from 'graphql-tag';

export default gql`
    mutation sfPackSessionPickup($list_id: [Int!]!) {
        sfPackSessionPickup(list_id: $list_id) {
            message
            success
        }
    }
`;