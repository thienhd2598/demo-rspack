import gql from 'graphql-tag';

export default gql`
query sme_catalog_photo_frames_aggregate($where: sme_catalog_photo_frames_bool_exp = {}) {
  sme_catalog_photo_frames_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
`;
