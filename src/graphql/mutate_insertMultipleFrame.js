import gql from 'graphql-tag';

export default gql`
    mutation createMultipleFrameImage($objects: [sme_catalog_photo_frames_insert_input!] = {}) {
        insert_sme_catalog_photo_frames(objects: $objects) {
            affected_rows
        }
    }
`;
