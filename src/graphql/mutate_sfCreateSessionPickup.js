import gql from 'graphql-tag';

export default gql`
    mutation sfCreateSessionPickup($search: SearchPackage = {}, $list_package_id: [Int], $session_pickup_note: String = "", $session_pickup_type: [String]) {
        sfCreateSessionPickup(search: $search, list_package_id: $list_package_id, session_pickup_note: $session_pickup_note, session_pickup_type: $session_pickup_type) {
            list_package_fail {
                error_message
                system_package_number
            }
            message
            success
            total_package
            total_package_fail
            total_package_success
            total_session_pickup
        }
    }
`;