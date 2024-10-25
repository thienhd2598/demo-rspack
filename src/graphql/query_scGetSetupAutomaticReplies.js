import gql from 'graphql-tag';

export default gql`
query scGetSetupAutomaticReplies($connector_channel_code: String, $page: Int!, $per_page: Int!) {
    scGetSetupAutomaticReplies(connector_channel_code: $connector_channel_code, page: $page, per_page: $per_page) {
        list_sale_channel_store {
            id
            replied_today
            mapStoreReplyTemplate {
                id
                status
                updated_at 
                autoReplyTemplate {
                    name  
                    id
                    autoRatingFilters {
                        status 
                        rating_star 
                    }
                }
            }
            updated_at
            name
        }
        total

  }
}

`;
