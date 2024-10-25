import gql from 'graphql-tag';

export default gql`
mutation update_sme_catalog_photo_frames_by_pk($id: Int!, $_set: sme_catalog_photo_frames_set_input = {}) {
  update_sme_catalog_photo_frames_by_pk(pk_columns: {id: $id}, _set: $_set) {
    asset_id
    asset_url
    created_at
    id
    sme_id
    updated_at
  }
}
`;
