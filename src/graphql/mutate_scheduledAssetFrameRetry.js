import gql from "graphql-tag";

export default gql`
  mutation scheduledAssetFrameRetry($list_id: [Int!]!) {
    scheduledAssetFrameRetry(list_id: $list_id) {
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
