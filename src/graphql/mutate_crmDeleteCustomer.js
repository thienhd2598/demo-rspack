import gql from 'graphql-tag';

export default gql`
    mutation crmDeleteCustomer($id: Int!) {
        crmDeleteCustomer(id: $id) {
            message
            success            
        }
    }
`