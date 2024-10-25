import gql from 'graphql-tag';

export default gql`
query scGetAutoReplyTemplate($page: Int!, $per_page: Int!) {
    scGetAutoReplyTemplate(page: $page, per_page: $per_page) {
        auto_reply_teamplate {
            autoRatingFilters {
                rating_star
                status 
                id
                autoRatingComments {
                    comment
                    id
                }
            }
            mapStoreReplyTemplates {
                store_id
            }
            created_at
            id
            name
            updated_at
        }
        total
  }
}
`;
