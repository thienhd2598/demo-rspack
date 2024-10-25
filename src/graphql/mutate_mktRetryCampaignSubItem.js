import gql from "graphql-tag";

export default gql`
    mutation mktRetryCampaignSubItem($campaign_id: Int, $campaign_sub_items_id: [Int]) {
        mktRetryCampaignSubItem(campaign_id: $campaign_id, campaign_sub_items_id: $campaign_sub_items_id) {
            message
            success
        }
    }
`;