import gql from "graphql-tag";

export default gql`
  mutation cfRetryExportFinanceOrder(
    $id: Int!
  ) {
    cfRetryExportFinanceOrder(
        id: $id
    ) {
        job_tracking_export
        message
        success
    }
  }
`;
