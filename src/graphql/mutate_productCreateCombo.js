import gql from 'graphql-tag';

export default gql`
mutation productComboCreate($productInput: CreateProductInput!) {
  productComboCreate(productInput: $productInput) {
    product_id
  }
}

`;
