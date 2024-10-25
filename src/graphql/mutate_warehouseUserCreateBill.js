import gql from 'graphql-tag';

export default gql`
    mutation warehouseUserCreateBill($warehouseUserCreateBillInput: WarehouseUserCreateBillInput!) {
        warehouseUserCreateBill(warehouseUserCreateBillInput: $warehouseUserCreateBillInput) {
            message
            success
            id
            results{
                index
                message
                sku
            }
            total
            totalSuccess
        }
    }   
`