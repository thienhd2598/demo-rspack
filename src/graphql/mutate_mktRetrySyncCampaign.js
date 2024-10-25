import gql from "graphql-tag";

export default gql`
    mutation mktRetrySyncCampaign($list_campaign_id: [Int]) {
        mktRetrySyncCampaign(list_campaign_id: $list_campaign_id) {
            message
            success
        }
    }
`;