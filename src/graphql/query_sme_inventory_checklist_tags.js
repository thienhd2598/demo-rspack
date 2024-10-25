import gql from 'graphql-tag';

export default gql`
    query sme_inventory_checklist_tags($limit: Int = 100, $offset: Int = 0, $where: sme_inventory_checklist_tags_bool_exp = {}, $order_by: [sme_inventory_checklist_tags_order_by!] = {created_at: desc}) {
        sme_inventory_checklist_tags(limit: $limit, offset: $offset, where: $where, order_by: { created_at: desc }) {
            created_at
            id
            sme_id
            title            
        }
    }
`;
