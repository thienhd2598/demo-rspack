import gql from 'graphql-tag';

export default gql`
mutation userShowProduct($ids: [String] = []) {
  userShowProduct(ids: $ids) {
    message
    success
  }
}

`;
