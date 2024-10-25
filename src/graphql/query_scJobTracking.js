import gql from "graphql-tag";

export default gql`
  query sc_job_tracking($id: Int!) {
    sc_job_tracking(id: $id) {
      failed_job
      success_job
      total_job
    }
  }
`;
