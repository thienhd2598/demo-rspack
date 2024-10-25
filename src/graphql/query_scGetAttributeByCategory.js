import gql from 'graphql-tag';

export default gql`
query scGetAttributeByCategory($sc_store_id: Int!, $category_id: Int!, $attribute_type: String = null, $skip: Boolean = false) {
  scGetAttributeByCategory(sc_category_id: $category_id, sc_store_id: $sc_store_id, attribute_type: $attribute_type) @skip(if: $skip) {
    attribute_type
    category_id
    connector_channel_code
    display_name
    attribute_groups {
      id
      ref_group_id
      ref_group_name
      sc_attribute_id
    }
    attribute_options {
      id
      name
      display_name
      display_name_en
      sc_attribute_group_id
    }
    id
    input_type
    is_mandatory
    name
    ref_id
    unit_options
    is_sale_prop
  }
}

`;
