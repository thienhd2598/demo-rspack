import gql from 'graphql-tag';

export default gql`
    mutation insert_sme_catalog_photo_library($objects: [sme_catalog_photo_library_insert_input!] = {}) {
        insert_sme_catalog_photo_library(objects: $objects) {
            affected_rows
            returning {
                asset_id
                asset_url
                category {
                    created_at
                    id
                    name
                }
                sme_id
                id
                created_at
                category_id
            }
        }
    }
`;
