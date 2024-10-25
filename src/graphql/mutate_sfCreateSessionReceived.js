import gql from 'graphql-tag';

export default gql`
    mutation sfCreateSessionReceived($received_packages: [ReceivedPackagesInput] = {}, $created_by_obj: String!, $shipping_carrier: String, $sme_warehouse_id: Int!) {
        sfCreateSessionReceived(received_packages: $received_packages, created_by_obj: $created_by_obj, shipping_carrier: $shipping_carrier, sme_warehouse_id: $sme_warehouse_id) {
            list_package_fail {
                message
                object_type
                object_tracking_number                
            }
            message
            success
            id
            total_package
            total_package_fail
            total_package_success
        }
    }
`;