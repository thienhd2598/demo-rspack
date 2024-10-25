import gql from 'graphql-tag';

export default gql`
mutation ScCreateMultipleProduct($list_sc_product_data: [ScCreateProductInput!]!) {
  ScCreateMultipleProduct(list_sc_product_data: $list_sc_product_data) {
    message
    success
  }
}


`;
