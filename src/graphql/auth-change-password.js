import gql from 'graphql-tag';

export default gql`
mutation authChangePassword($password: String!, $token: String!) {
  authChangePassword(password: $password, token: $token) {
    message
    message_raw
    success
  }
}


`;
