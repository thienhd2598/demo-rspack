import gql from 'graphql-tag';

export default gql`
    mutation sfCancelSessionPickup($list_session_pickup_id: [Int]) {
        sfCancelSessionPickup(list_session_pickup_id: $list_session_pickup_id) {
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