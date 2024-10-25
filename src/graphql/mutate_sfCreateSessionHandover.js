import gql from 'graphql-tag';

export default gql`
    mutation sfCreateSessionHandover($list_package_id: [Int!]!, $sme_warehouse_id: Int!, $created_by_obj: String!) {
        sfCreateSessionHandover(list_package_id: $list_package_id, sme_warehouse_id: $sme_warehouse_id, created_by_obj: $created_by_obj) {
            list_package_fail {
                error_message
                system_package_number
            }
            id
            message
            success
            total_package
            total_package_fail
            total_package_success
        }
    }
`;