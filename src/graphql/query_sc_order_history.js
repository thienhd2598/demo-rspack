import gql from 'graphql-tag';

export default gql`
    query order_history($limit: Int = 10, $offset: Int = 0, $where: order_history_bool_exp = {}, $order_by: [order_history_order_by!] = {}) {
        order_history(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
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