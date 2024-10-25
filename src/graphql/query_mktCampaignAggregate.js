import gql from "graphql-tag";

export default gql`
query mktCampaignAggregate($search: SearchCampaign = {}) {
  mktCampaignAggregate(search: $search) {
    count
  }
}
`