import gql from "graphql-tag";

export default gql`
  mutation inventoryRetryExport($id: Int!) {
    inventoryRetryExport(id: $id) {
      data
      message
      success
    }
  }
`;
