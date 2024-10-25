import gql from 'graphql-tag';

export default gql`
    mutation sfPrintHandover($list_handover_id: [Int]) {
        sfPrintHandover(list_handover_id: $list_handover_id) {
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