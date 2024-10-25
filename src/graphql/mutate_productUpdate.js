import gql from 'graphql-tag';

export default gql`
mutation productUpdate($productUpdateInput: UpdateProductInput!) {
  productUpdate(productUpdateInput: $productUpdateInput) {
    product_id
    message
  }
}


`;
