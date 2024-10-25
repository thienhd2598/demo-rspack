import gql from 'graphql-tag';

export default gql`
mutation userUpdateGtinFromFile($url: String!) {
  userUpdateGtinFromFile(url: $url) {
    message
    success
    total
    totalSuccess
    errors {
      message
      sku
    }
  }
}
`