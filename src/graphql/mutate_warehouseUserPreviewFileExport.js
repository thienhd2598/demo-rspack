import gql from 'graphql-tag';

export default gql`
    mutation warehouseUserPreviewFileExport($bill_type: String!, $product_type: Int!, $url: String!) {
    warehouseUserPreviewFileExport(bill_type: $bill_type, product_type: $product_type, url: $url) {
        variants {
            id
            lotSerial
            expiredDate
            manufactureDate
            quantity
        }
        message
        success
        total
        totalSuccess
        errors {
            index
            message
            sku
        }
    }
}
 
`