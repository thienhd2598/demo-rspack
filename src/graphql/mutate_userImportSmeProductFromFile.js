import gql from 'graphql-tag';

export default gql`
mutation userImportSmeProductFromFile($url: String!, $type: Int!) {
  userImportSmeProductFromFile(url: $url, type: $type) {
    errors {
      message
      title
    }
    message
    success
    total
    totalSuccess
    resultFile
  }
}
`