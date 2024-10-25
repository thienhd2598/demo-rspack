import gql from 'graphql-tag';

export default gql`
    mutation warehouseUserDeleteBill($id: Int!) {
        warehouseUserDeleteBill(id: $id) {
            message
            success
        }
    }   
`