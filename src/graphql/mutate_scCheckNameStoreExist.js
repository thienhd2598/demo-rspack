import gql from 'graphql-tag';

export default gql`

mutation scCheckNameStoreExist($name: String) {
  scCheckNameStoreExist(name: $name) {
    count_exists
    message
    success
  }
}
`;
