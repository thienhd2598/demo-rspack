import gql from 'graphql-tag';

export default gql`
    mutation crmDeleteSupport($id: Int!) {
        crmDeleteSupport(id: $id) {
            message
            success            
        }
    }
`