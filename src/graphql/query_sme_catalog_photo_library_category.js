import gql from 'graphql-tag';

export default gql`
    query sme_catalog_photo_library_category($limit: Int = 500, $offset: Int = 0, $where: sme_catalog_photo_library_category_bool_exp = {}, $order_by: [sme_catalog_photo_library_order_by!] = {created_at: desc}, $wherePhoto: sme_catalog_photo_library_bool_exp = {}) {
        sme_catalog_photo_library_category(limit: $limit, offset: $offset, where: $where, order_by: { created_at: desc }) {
            id
            name
            created_at
            parent_id
            childrens {
                created_at
                id
                name
                parent_id
            }
            photoLibraries (where: $wherePhoto) {
                asset_id
                asset_url
                category_id
                created_at
                id
                sme_id
            }
            photoLibraries_aggregate (where: $wherePhoto) {
                aggregate {
                    count
                }
            }
            type
        }
    }
`;
