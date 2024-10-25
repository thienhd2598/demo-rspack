import gql from 'graphql-tag';

export default gql`
    mutation delete_warehouse_bill_items_by_pk($id: Int!) {
        delete_warehouse_bill_items_by_pk(id: $id) {
            id
        }
    }   
`