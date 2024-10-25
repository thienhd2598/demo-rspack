import gql from 'graphql-tag';

export default gql`

mutation delete_sme_catalog_photo_frames($idPhoto: Int!) {
    delete_sme_catalog_photo_frames(where: {id: {_eq: $idPhoto}}) {
        affected_rows
    }
}
`;