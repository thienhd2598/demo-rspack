import gql from 'graphql-tag';

export default gql`
    mutation sfApproveSessionReceived($list_received_id: [Int!]!) {
        sfApproveSessionReceived(list_received_id: $list_received_id) {
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