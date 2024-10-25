import gql from 'graphql-tag';

export default gql`
    mutation warehouseUserCancelBill($id: Int!) {
        warehouseUserCancelBill(id: $id) {
            message
            success
        }
    }   
`