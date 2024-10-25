import gql from 'graphql-tag';

export default gql`
mutation createUserByEmailPassword($password: String!, $email: String!) {
  createUserByEmailPassword(password: $password, email: $email) {
    message
    success
    user_id
  }
}
`;
