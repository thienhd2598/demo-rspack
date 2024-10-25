import gql from 'graphql-tag';

export default gql`
    mutation delete_sme_inventory_checklist_tag_mapping_by_pk($id: Int!) {
        delete_sme_inventory_checklist_tag_mapping_by_pk(id: $id) {
            id
        }
    }
`