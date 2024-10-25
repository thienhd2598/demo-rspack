import gql from 'graphql-tag';

export default gql`
query warehouseGetTemplateUpdateQuantityBill($id: Int!) {
  warehouseGetTemplateUpdateQuantityBill(id: $id) {
    message
    success
    url
    quantity
  }
}
`;
