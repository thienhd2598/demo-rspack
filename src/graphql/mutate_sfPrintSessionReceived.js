import gql from 'graphql-tag';

export default gql`
    mutation sfPrintSessionReceived($list_session_received_id: [Int]) {
        sfPrintSessionReceived(list_session_received_id: $list_session_received_id) {
            html
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