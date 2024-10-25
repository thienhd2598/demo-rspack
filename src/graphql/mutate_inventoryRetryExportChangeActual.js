import gql from "graphql-tag";

export default gql`
  mutation inventoryRetryExportChangeActual($id: Int!) {
    inventoryRetryExportChangeActual(id: $id) {
      message
      success
    }
  }
`;
