import gql from 'graphql-tag';

export default gql`
    mutation sfAddSessionHandoverPackage($id: Int!, $package_id: Int!) {
        sfAddSessionHandoverPackage(id: $id, package_id: $package_id) {            
            message
            success
        }
    }
`;