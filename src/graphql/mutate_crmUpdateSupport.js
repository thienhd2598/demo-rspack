import gql from 'graphql-tag';

export default gql`
    mutation crmUpdateSupport($id: Int!, $list_type: [String], $content: String) {
        crmUpdateSupport(id: $id, list_type: $list_type, content: $content) {
            message
            success            
        }
    }
`