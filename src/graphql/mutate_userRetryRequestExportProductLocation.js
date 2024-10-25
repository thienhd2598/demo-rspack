import gql from "graphql-tag";

export default gql`
  mutation userRetryRequestExportProductLocation($id: Int!) {
    userRetryRequestExportProductLocation(id: $id) {
        data
        message
        success
    }
  }
`;
