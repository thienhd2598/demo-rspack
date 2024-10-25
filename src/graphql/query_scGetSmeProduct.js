import gql from 'graphql-tag';

export default gql`
query scGetSmeProduct($sme_product_id: ID!) {
  scGetSmeProduct(sme_product_id: $sme_product_id) {
    id
    attribute_values {
      id
      value
      input_type
      option_name
      unit
    }
    name
    connector_channel_code
    ref_brand_name
    sme_brand_id
    sme_id
    sme_product_id
    store_id
    warranty_period
    warranty_policy
    warranty_type
    ref_category_id
    ref_logistic_channel_id
    sc_brand_id
    is_valid_logistic
  }
}



`;
