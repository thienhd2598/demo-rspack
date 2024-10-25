import gql from 'graphql-tag';

export default gql`
    mutation savePosOrder($customer_info: ManualCustomer = {}, $order_info: ManualOrderInfo = {}, $order_items: [ManualOrderItem] = {}, $package_data: ManualPackage = {}, $received_address: ManualRecipientAddress = {}) {
        savePosOrder(customer_info: $customer_info, order_info: $order_info, order_items: $order_items, package_data: $package_data, received_address: $received_address) {
            message
            order_id
            order_at
            ref_id
            success
        }
    }   
`