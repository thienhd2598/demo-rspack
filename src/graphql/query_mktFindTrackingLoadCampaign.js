import gql from "graphql-tag";

export default gql`
query mktFindTrackingLoadCampaign(
    $id: Int!
) {
  mktFindTrackingLoadCampaign(id: $id) {
    finish_time
    id
    start_time
    total_campaign
    total_fail
    total_job_load
    total_job_load_processed
    total_success
  }
}
`