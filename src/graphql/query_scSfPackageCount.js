import gql from 'graphql-tag';

export default gql`
    query scSfPackageCount($search: SearchPackage = {}) {
        scSfPackageCount(search: $search) {
            count
            count_mio
            count_sio
        }
    }
`;
