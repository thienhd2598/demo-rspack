import gql from 'graphql-tag';

export default gql`
    query sme_catalog_product_tags($limit: Int = 100, $offset: Int = 0, $where: sme_catalog_product_tags_bool_exp = {}, $order_by: [sme_catalog_product_tags_order_by!] = {created_at: desc}) {
        sme_catalog_product_tags(limit: $limit, offset: $offset, where: $where, order_by: { updated_at: desc }) {
            created_at
            id
            sme_id
            title
            updated_at
        }
    }
`;
