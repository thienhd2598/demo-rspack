import gql from 'graphql-tag';

export default gql`
mutation userUpdateProductInfoMulti($userUpdateProductInfoItemInput: [UserUpdateProductInfoItemInput]) {
  userUpdateProductInfoMulti(userUpdateProductInfoItemInput: $userUpdateProductInfoItemInput) {
    message
    success
    total
    totalSuccess
    errors {
      id
      message
      name
    }
  }
}
`;