import gql from "graphql-tag";

export default gql`
  mutation scheduledAssetFrameFinish($list_id: [Int!]!) {
    scheduledAssetFrameFinish(list_id: $list_id) {
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
