import gql from 'graphql-tag';

export default gql`
    mutation coUpdateReturnOrderShippingTrackingNumber($return_order_id: Int!, $shipping_tracking_number: String) {
        coUpdateReturnOrderShippingTrackingNumber(
            return_order_id: $return_order_id, 
            shipping_tracking_number: $shipping_tracking_number,
        ) {
            message
            success            
        }
    }
`