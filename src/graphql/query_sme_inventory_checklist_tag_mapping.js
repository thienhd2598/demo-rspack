import gql from 'graphql-tag';

export default gql`
query sme_inventory_checklist_tag_mapping($where: sme_inventory_checklist_tag_mapping_bool_exp) {
  sme_inventory_checklist_tag_mapping(where: $where) {
    id
    tag{
      title
      id
    }
  }
}


`;
