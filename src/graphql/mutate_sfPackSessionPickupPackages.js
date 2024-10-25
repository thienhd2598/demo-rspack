import gql from 'graphql-tag';

export default gql`
    mutation sfPackSessionPickupPackages($list_pickup_package_id: [Int], $pickup_id: Int!) {
        sfPackSessionPickupPackages(list_pickup_package_id: $list_pickup_package_id, pickup_id: $pickup_id) {            
            message
            success
        }
    }
`;