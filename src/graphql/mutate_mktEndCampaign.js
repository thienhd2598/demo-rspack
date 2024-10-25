import gql from "graphql-tag";

export default gql`
mutation mktEndCampaign($list_campaign_id: [Int]) {
  mktEndCampaign(list_campaign_id: $list_campaign_id) {
    message
    success
  }
}
`;