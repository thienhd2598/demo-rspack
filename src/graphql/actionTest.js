import gql from 'graphql-tag';

export default gql`

query actionTest {
  actionTest(arg1: {username: ""}) {
    message
  }
}


`;
