import gql from 'graphql-tag';

export default gql`
mutation inventoryUpdate($inventoryInput: InventoryUpdateInput!) {
  inventoryUpdate(inventoryInput: $inventoryInput) {
    message
    success
  }
}
`;
