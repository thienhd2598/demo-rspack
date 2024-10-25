import gql from 'graphql-tag';

export default gql`
mutation warehouseInboundBillPrint($id: Int!) {
  warehouseInboundBillPrint(id: $id) {
    data
    message
    success
  }
}
`