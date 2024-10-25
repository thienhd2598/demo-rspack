import gql from 'graphql-tag';

export default gql`
    mutation cancelManualOrder($list_package_id: [Int!]!) {
        cancelManualOrder(list_package_id: $list_package_id) {
            list_fail {
                message
                order_ref_id
                order_id
                system_package_number
                package_id
            }
            message
            success
            total_fail
            total_success
        }
    }
`;