import gql from 'graphql-tag';

export default gql`
query sme_catalog_photo_frames_by_pk($id: Int!) {
    sme_catalog_photo_frames_by_pk(id: $id) {
        asset_id
        asset_url
        created_at
        sme_id
        updated_at
        config
        is_static
        shape
        id
        name
        scheduleCount {
            frame_id
            total_scheduled
        }
    }
}

`;
