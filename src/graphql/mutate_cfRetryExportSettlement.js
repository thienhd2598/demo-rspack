import gql from "graphql-tag";

export default gql`
  mutation cfRetryExportSettlement($id: Int!) {
    cfRetryExportSettlement(
        id: $id
    ) {
        job_tracking_export_order
        message
        success
    }
  }
`;
