import gql from 'graphql-tag';

export default gql`
    mutation sfCancelSessionHandover($list_handover_id: [Int!]!) {
        sfCancelSessionHandover(list_handover_id: $list_handover_id) {
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