import gql from "graphql-tag";

export default gql`
  query inventorySumProductChangeActual(
    $inventorySumProductChangeActualInput: InventorySumProductChangeActualInput! = {}
  ) {
    inventorySumProductChangeActual(
        inventorySumProductChangeActualInput: $inventorySumProductChangeActualInput
    ) {
        data
        message
        success
    }
  }
`;
