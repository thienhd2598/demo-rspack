import gql from "graphql-tag";

export default gql`
  mutation inventoryCreateExportRequest(
    $inventoryCreateExportRequestInput: InventoryCreateExportRequestInput! = {}
  ) {
    inventoryCreateExportRequest(
      inventoryCreateExportRequestInput: $inventoryCreateExportRequestInput
    ) {
      data
      message
      success
    }
  }
`;
