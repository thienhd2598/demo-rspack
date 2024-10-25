import gql from 'graphql-tag';

export default gql`
    mutation saveManualOrder($customer_info: ManualCustomer = {}, $order_info: ManualOrderInfo = {}, $order_items: [ManualOrderItem] = {}, $package_data: ManualPackage = {}, $received_address: ManualRecipientAddress = {}, $need_approved: Int) {
        saveManualOrder(customer_info: $customer_info, order_info: $order_info, order_items: $order_items, package_data: $package_data, received_address: $received_address, need_approved: $need_approved) {
            message
            order_id
            success
        }
    }   
`