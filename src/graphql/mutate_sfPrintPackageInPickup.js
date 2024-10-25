import gql from 'graphql-tag';

export default gql`
    mutation sfPrintPackageInPickup($pickup_id: Int!, $print_type: Int!, $pickup_package_ids: [Int]) {
        sfPrintPackageInPickup(pickup_id: $pickup_id, print_type: $print_type, pickup_package_ids: $pickup_package_ids) {
            html
            message
            success
        }
    }
`;