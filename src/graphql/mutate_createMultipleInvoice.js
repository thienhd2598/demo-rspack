import gql from 'graphql-tag';

export default gql`
    mutation createMultipleInvoice($list_id: [Int]) {
        createMultipleInvoice(list_id: $list_id) {
            errors {
                finance_order_id
                message
                code
            }
            message
            success
            total
            total_error
        }
    }   
`