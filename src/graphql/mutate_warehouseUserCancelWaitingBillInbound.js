import gql from 'graphql-tag';

export default gql`
    mutation warehouseUserCancelWaitingBillInbound($id: Int!) {
        warehouseUserCancelWaitingBillInbound(id: $id) {
            message
            success
        }
    } 
`