import gql from "graphql-tag";

export default gql`
mutation  mktSyncCampaignScheduleFrame($campaign_id: Int) {
  mktSyncCampaignScheduleFrame(campaign_id: $campaign_id) {
    message
    success
  }
}
`;