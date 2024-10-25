import gql from 'graphql-tag';

export default gql`
query op_catalog_product_attributes($attribute_type: Int!, $category_id: Int!, $skip: Boolean = false) {
  op_catalog_product_attributes(category_id: $category_id, attribute_type: $attribute_type) @skip(if: $skip) {
    attribute_type
    category_id
    display_name
    has_asset
    id
    input_type
    is_mandatory
    name
    options {
      name
    }
  }
}


`;
