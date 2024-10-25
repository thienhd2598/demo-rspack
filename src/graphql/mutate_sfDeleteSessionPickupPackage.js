import gql from 'graphql-tag';

export default gql`
    mutation sfDeleteSessionPickupPackage($list_pickup_package_id: [Int!]!, $id: Int!) {
        sfDeleteSessionPickupPackage(list_pickup_package_id: $list_pickup_package_id, id: $id) {            
            message
            success
        }
    }
`;