import gql from 'graphql-tag';

export default gql`
mutation scCreateProduct($sc_product_data: ScCreateProductInput!) {
  scCreateProduct(sc_product_data: $sc_product_data) {
    product_id
    success
    message
  }
}

`;
