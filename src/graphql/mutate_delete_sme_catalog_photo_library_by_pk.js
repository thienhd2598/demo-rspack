import gql from 'graphql-tag';

export default gql`
    mutation delete_sme_catalog_photo_library_by_pk($id: bigint = "") {
        delete_sme_catalog_photo_library_by_pk(id: $id) {
            id
        }
    }
`;