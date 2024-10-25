import gql from 'graphql-tag';

export default gql`
    mutation crmSaveCustomerTags($tags: [CustomerTag] = {}, $list_customer_id: [Int], $action_type: Int) {
        crmSaveCustomerTags(tags: $tags, list_customer_id: $list_customer_id, action_type: $action_type) {
            message
            success            
        }
    }
`