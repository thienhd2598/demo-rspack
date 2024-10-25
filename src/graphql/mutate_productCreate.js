import gql from 'graphql-tag';

export default gql`
mutation productCreate($productInput: CreateProductInput!) {
  productCreate(productInput: $productInput) {
    product_id
  }
}

`;
