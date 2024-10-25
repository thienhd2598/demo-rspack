import gql from "graphql-tag";

export default gql`
  query scFindAutoReplyTemplate($id: Int!) {
    scFindAutoReplyTemplate(id: $id) {
       name
       autoRatingFilters {
        autoRatingComments {
            comment
        }
        rating_star
        status
       }
    }
  }
`;
