import gql from "graphql-tag";

export default gql`
  mutation scheduledAssetFrameCheckDuplicate($title: String!, $id: Int) {
    scheduledAssetFrameCheckDuplicate(title: $title, id: $id) {
      message
      success
      count_exists
    }
  }
`;
