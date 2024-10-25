import gql from 'graphql-tag';

export default gql`
    mutation warehouseApproveBill($id: Int!) {
        warehouseApproveBill(id: $id) {
            message
            success
        }
    }

`