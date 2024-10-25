import gql from "graphql-tag";

export default gql`
  mutation scheduledAssetFrameDelete($list_id: [Int!]!) {
    scheduledAssetFrameDelete(list_id: $list_id) {
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
