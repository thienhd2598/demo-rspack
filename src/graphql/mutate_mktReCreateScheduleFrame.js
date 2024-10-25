import gql from "graphql-tag";

export default gql`
mutation  mktReCreateScheduleFrame($campaign_id: Int!) {
  mktReCreateScheduleFrame(campaign_id: $campaign_id) {
    message
    success
  }
}
`;