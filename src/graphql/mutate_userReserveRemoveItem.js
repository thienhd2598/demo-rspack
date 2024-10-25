import gql from 'graphql-tag';

export default gql`
mutation userReserveRemoveItem ($sc_variant_id: Int , $ticket_id: Int, $variant_id: String = ""){
    userReserveRemoveItem(sc_variant_id: $sc_variant_id, ticket_id: $ticket_id, variant_id: $variant_id) {
        sc_variant_id
        variant_id
        message
        success
    }
}`