import gql from 'graphql-tag';

export default gql`
    query sme_catalog_photo_frames($limit: Int = 500, $offset: Int = 0, $where: sme_catalog_photo_frames_bool_exp = {}, $order_by: [sme_catalog_photo_frames_order_by!] = {created_at: desc}) {
        sme_catalog_photo_frames(limit: $limit, offset: $offset, where: $where, order_by: { updated_at: desc }) {
            asset_id
            asset_url
            category_id
            created_at
            name
            id
            sme_id
            config
            is_static
            shape
            updated_at
            name
            scheduleCount {
              frame_id
              total_scheduled
            }
          }

        sme_catalog_photo_frames_aggregate (where: $where) {
            aggregate {
              count
            }
          }
    }
`;
