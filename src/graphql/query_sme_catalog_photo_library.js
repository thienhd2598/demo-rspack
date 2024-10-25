import gql from 'graphql-tag';

export default gql`
    query sme_catalog_photo_library($limit: Int = 500, $offset: Int = 0, $where: sme_catalog_photo_library_bool_exp = {}, $order_by: [sme_catalog_photo_library_order_by!] = {created_at: desc}) {
        sme_catalog_photo_library(limit: $limit, offset: $offset, where: $where, order_by: { created_at: desc }) {
            id            
            asset_id
            asset_url
            created_at
            sme_id            
            category {
                id
                name
                created_at
            }
          }

        sme_catalog_photo_library_aggregate (where: $where) {
            aggregate {
              count
            }
        }
    }
`;
