import gql from 'graphql-tag';

export default gql`
    mutation warehouseUserUpdateBill($warehouseUserUpdateBillInput: WarehouseUserUpdateBillInput!) {
        warehouseUserUpdateBill(warehouseUserUpdateBillInput: $warehouseUserUpdateBillInput) {
            message
            success            
        }
    }   
`