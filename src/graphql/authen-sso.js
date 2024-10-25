import gql from 'graphql-tag';

export default gql`
mutation authSSO($firebase_id: String!, $idToken: String!, $provider: String) {
  authSSO(firebase_id: $firebase_id, idToken: $idToken, provider: $provider) {
    user_id
  }
}


`;
