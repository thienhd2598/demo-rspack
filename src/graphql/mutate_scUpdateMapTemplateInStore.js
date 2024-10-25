import gql from 'graphql-tag';

export default gql`
    mutation scUpdateMapTemplateInStore($reply_template_id: Int!,$status: Int, $store_id: Int!) {
        scUpdateMapTemplateInStore(reply_template_id: $reply_template_id,status: $status, store_id: $store_id) {
            message
            success     
        }
    }
`