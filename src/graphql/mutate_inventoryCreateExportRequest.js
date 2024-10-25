import gql from "graphql-tag";

export default gql`
  mutation inventoryRetryExport($inventoryCreateExportRequestInput: InventoryCreateExportRequestInput! = {}) {
    inventoryRetryExport(inventoryCreateExportRequestInput: $inventoryCreateExportRequestInput) {
        data
        message
        success
    }
  }
`;
