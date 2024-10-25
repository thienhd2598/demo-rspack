import gql from 'graphql-tag';

export default gql`
mutation warehouseUpdateQuantityBillFromFile($id: Int!, $url: String!) {
  warehouseUpdateQuantityBillFromFile(id: $id, url: $url) {
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
`;
