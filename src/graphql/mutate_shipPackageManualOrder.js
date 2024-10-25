import gql from 'graphql-tag';

export default gql`
    mutation shipPackageManualOrder($list_package_id: [Int!]!) {
        shipPackageManualOrder(list_package_id: $list_package_id) {
            list_fail {
                message
                order_id
                system_package_number
                package_id
                order_ref_id
            }
            message
            success
            total_fail
            total_success
        }
    }
`;