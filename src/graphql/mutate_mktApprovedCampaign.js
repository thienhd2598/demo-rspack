import gql from "graphql-tag";

export default gql`
mutation mktApprovedCampaign($list_campaign_id: [Int]) {
  mktApprovedCampaign(list_campaign_id: $list_campaign_id) {
    message
    success
  }
}
`;