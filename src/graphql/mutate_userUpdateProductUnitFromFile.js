import gql from 'graphql-tag';

export default gql`
mutation userUpdateProductUnitFromFile($url: String!) {
  userUpdateProductUnitFromFile(url: $url) {
    message
    resultFile
    success
    total
    totalSuccess
    errors {
      message
      title
    }
  }
}

`