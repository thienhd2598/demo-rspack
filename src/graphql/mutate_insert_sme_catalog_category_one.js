import gql from 'graphql-tag';

export default gql`
    mutation insert_sme_catalog_category_one($object: sme_catalog_category_insert_input! = {}) {
        insert_sme_catalog_category_one(object: $object) {
            name
        }
    }
`;
