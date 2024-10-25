import gql from 'graphql-tag';

export default gql`
mutation userUpdateMe($userUpdateMeInput: UserUpdateMeInput!) {
  userUpdateMe(userUpdateMeInput: $userUpdateMeInput) {
    message
    success
  }
}

`;
