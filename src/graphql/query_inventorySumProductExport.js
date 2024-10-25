import gql from "graphql-tag";

export default gql`
  query inventorySumProductExport(
    $inventoryCreateExportRequestInput: InventoryCreateExportRequestInput! = {}
  ) {
    inventorySumProductExport(
        inventoryCreateExportRequestInput: $inventoryCreateExportRequestInput
    ) {
        data
        message
        success
    }
  }
`;
