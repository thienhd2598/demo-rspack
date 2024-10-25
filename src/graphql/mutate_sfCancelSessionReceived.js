import gql from 'graphql-tag';

export default gql`
    mutation sfCancelSessionReceived($list_received_id: [Int!]!) {
        sfCancelSessionReceived(list_received_id: $list_received_id) {
            list_fail {
                code
                error_message
                id
            }
            message
            success
        }
    }
`;