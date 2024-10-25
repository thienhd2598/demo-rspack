import gql from 'graphql-tag';

export default gql`
mutation userReserveAddItem( $ticket_id: Int, $reserve_items: [ReserveItemInput]) {
    userReserveAddItem(reserve_items: $reserve_items, ticket_id: $ticket_id) {
      id
      message
      success
      sc_variant_id
      variant_id
      warehouse_id
    }
}`