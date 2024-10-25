import gql from "graphql-tag";

export default gql`
query mktCampaignTemplateAggregate($search: SearchCampaignTemplate = {}) {  
  mktCampaignTemplateAggregate(search: $search) {
    count
  }
}
`