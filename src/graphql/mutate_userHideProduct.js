import gql from 'graphql-tag';

export default gql`
mutation userHideProduct($id: [String], $is_delete: Boolean!) {
  userHideProduct(id: $id, is_delete: $is_delete) {
    message
    success
    errors {
      id
      message
      name
    }
    total
  }
}

`;
