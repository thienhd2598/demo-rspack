import gql from "graphql-tag";

export default gql`
  mutation inventoryCreateExportChangeActualRequest($inventorySumProductChangeActualInput: InventorySumProductChangeActualInput! = {}) {
    inventoryCreateExportChangeActualRequest(inventorySumProductChangeActualInput: $inventorySumProductChangeActualInput) {
        data
        message
        success
    }
  }
`;
