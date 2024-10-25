import gql from 'graphql-tag';

export default gql`
    mutation delete_warehouse_bills_by_pk($id: Int!) {
        delete_warehouse_bills_by_pk(id: $id) {
            id
        }
    }   
`