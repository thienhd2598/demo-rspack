import gql from 'graphql-tag';

export default gql`
query sc_sale_channel_catalog_product_attributes($category_id: Int!, $skip: Boolean = false, $attribute_type: String = "") {
  sc_sale_channel_catalog_product_attributes(category_id: $category_id, attribute_type: $attribute_type) @skip(if: $skip) {
    attribute_type
    category_id
    connector_channel_code
    display_name
    attribute_options {
      id
      name
    }
    id
    input_type
    is_mandatory
    name
    ref_id
  }
}



`;
