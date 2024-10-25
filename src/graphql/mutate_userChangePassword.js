import gql from 'graphql-tag';

export default gql`
mutation userChangePassword($newPassword: String!, $oldPassword: String!) {
  userChangePassword(newPassword: $newPassword, oldPassword: $oldPassword) {
    message
    success
  }
}
`;
