import gql from 'graphql-tag';

export default gql`
    mutation sfCompleteSessionHandover($list_handover_id: [Int]) {
        sfCompleteSessionHandover(list_handover_id: $list_handover_id) {
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