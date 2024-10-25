import gql from 'graphql-tag';

export default gql`
    mutation warehouseConfirmBill($id: Int!) {
        warehouseConfirmBill(id: $id) {
            message
            success            
        }
    }
`