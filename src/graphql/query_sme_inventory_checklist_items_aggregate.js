import gql from 'graphql-tag';

export default gql`
    query sme_inventory_checklist_items_aggregate($where: sme_inventory_checklist_items_bool_exp = {}) {
        sme_inventory_checklist_items_aggregate(where: $where) {
            aggregate {
            count
            }
        }
    }
`;
