import gql from 'graphql-tag';

export default gql`
    mutation sfAddReceivedPackage($sf_received_id: Int!, $received_package: ReceivedPackagesInput) {
        sfAddReceivedPackage(sf_received_id: $sf_received_id, received_package: $received_package) {
        message
        success
        }
    }
`;