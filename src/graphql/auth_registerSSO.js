import gql from 'graphql-tag';

export default gql`
mutation registerSSO($firebase_id: String!, $idToken: String!, $provider: String) {
  registerSSO(idToken: $idToken, provider: $provider, firebase_id: $firebase_id) {
    message
    success
    user_id
  }
}
`;
