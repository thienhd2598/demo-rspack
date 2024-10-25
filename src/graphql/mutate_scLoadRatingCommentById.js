import gql from "graphql-tag";

export default gql`
  mutation scLoadRatingCommentById($list_comment_id: [Int]) {
    scLoadRatingCommentById(list_comment_id: $list_comment_id) {
      message
      success
    }
  }
`;
