import gql from "graphql-tag";

export default gql`
  mutation mktVerifyCampaignScheduleFrame($campaign_id: Int) {
    mktVerifyCampaignScheduleFrame(campaign_id: $campaign_id) {
        message
        success
    }
  }
`;