import gql from 'graphql-tag';

export default gql`
mutation userCheckRoleName($name: String!) {
  userCheckRoleName(name: $name) {
    isExists
  }
}
`;
