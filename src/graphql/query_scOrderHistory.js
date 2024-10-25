import gql from 'graphql-tag';

export default gql`
    query scOrderHistory($order_id: Int!) {
        scOrderHistory(order_id: $order_id) {
            created_at
            id
            order_id
            status
            event_name
            updated_at
            updated_time
        }
    }
`;