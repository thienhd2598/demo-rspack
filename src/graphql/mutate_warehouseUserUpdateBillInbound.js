import gql from 'graphql-tag';

export default gql`
mutation warehouseUserUpdateBillInbound($id: Int!, $items: [WarehouseUserUpdateBillItem]) {
  warehouseUserUpdateBillInbound(warehouseUserUpdateBillInboundInput: {id: $id, items: $items}) {
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