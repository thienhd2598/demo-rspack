import gql from "graphql-tag";

export default gql`
  mutation scheduledAssetProductRetry($list_id: [Int!]!, $scheduled_frame_id: Int!) {
    scheduledAssetProductRetry(list_id: $list_id, scheduled_frame_id: $scheduled_frame_id) {
        message
        success
        list_error {
            id
            message
        }
        total
        total_error
    }
  }
`;
