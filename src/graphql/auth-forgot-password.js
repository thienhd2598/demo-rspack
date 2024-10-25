import gql from 'graphql-tag';

export default gql`
mutation authForgotPassword($email: String!) {
  authForgotPassword(email: $email) {
    message
    message_raw
    success
  }
}

`;
