import gql from 'graphql-tag';

export default gql`
mutation checkEmailExist($email: String!) {
  checkEmailExist(email: $email) {
    isExist
  }
}
`;
