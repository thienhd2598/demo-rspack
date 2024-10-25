import gql from 'graphql-tag';

export default gql`
    mutation sfAssignPickupPic($list_session_pickup_id: [Int], $pic_id: String!) {
        sfAssignPickupPic(list_session_pickup_id: $list_session_pickup_id, pic_id: $pic_id) {
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