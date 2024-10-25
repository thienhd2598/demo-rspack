import gql from 'graphql-tag';

export default gql`
mutation userDeleteMember($id: String!) {
  userDeleteMember(id: $id) {
    message
    success
  }
}

`;
