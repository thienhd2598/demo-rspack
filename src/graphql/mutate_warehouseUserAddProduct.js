import gql from 'graphql-tag';

export default gql`
    mutation warehouseUserAddProduct($billId: Int!, $variantIds: [String]) {
        warehouseUserAddProduct(variantIds: $variantIds, billId: $billId) {
            id
            message
            success
            error_items {
                checklistCode
                checklistId
                sku
                variantId
            }
        }
    }   
`