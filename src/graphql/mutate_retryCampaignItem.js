import gql from "graphql-tag"
export default gql`mutation mktRetryCampaignItem($campaign_id: Int , $list_campaign_item_id: [Int] ) {
  mktRetryCampaignItem(campaign_id: $campaign_id, list_campaign_item_id: $list_campaign_item_id) {
    message
    success
  }
}`
