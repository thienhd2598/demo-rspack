import gql from 'graphql-tag';

export default gql`
mutation scRemoveProductFrameImages($products: [Int!]!) {
    scRemoveProductFrameImages(products: $products) {
      success
      message
    }
  }
`