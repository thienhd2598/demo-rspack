import gql from 'graphql-tag';

export default gql`
query warehouse_reserve_tickets($limit: Int = 10, $offset: Int = 0, $where: warehouse_reserve_tickets_bool_exp = {}, $order_by: [warehouse_reserve_tickets_order_by!] = { updated_at: desc }) {
    warehouse_reserve_tickets(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
        created_at
        end_date
        id
        name
        sc_store_id
        sme_id
        status
        updated_at
        total_variant
        start_date
        total_error
    }

    warehouse_reserve_tickets_aggregate(where: $where) {
        aggregate {
          count
        } 
    }
}
`;
