import gql from "graphql-tag";

export default gql`
mutation mktLoadCampaignByStore($store_id: Int!) {
  mktLoadCampaignByStore(store_id: $store_id) {
    message
    success
    tracking_id
  }
}
`;