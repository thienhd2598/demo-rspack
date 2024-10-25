import gql from 'graphql-tag';

export default gql`
    mutation crmCreateSupport($crm_customer_id: Int!, $list_type: [String], $content: String) {
        crmCreateSupport(crm_customer_id: $crm_customer_id, list_type: $list_type, content: $content) {
            message
            success            
        }
    }
`