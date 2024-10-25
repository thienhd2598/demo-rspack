import gql from 'graphql-tag';

export default gql`
    mutation sfDeleteSessionHandoverPackage($id: Int!, $handover_package_id: Int!) {
        sfDeleteSessionHandoverPackage(id: $id, handover_package_id: $handover_package_id) {
            message
            success
        }
    }
`;