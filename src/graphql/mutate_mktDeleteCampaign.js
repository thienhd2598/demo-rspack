import gql from "graphql-tag";

export default gql`
mutation mktDeleteCampaign($list_campaign_id: [Int]) {
  mktDeleteCampaign(list_campaign_id: $list_campaign_id) {
    message
    success
  }
}
`;