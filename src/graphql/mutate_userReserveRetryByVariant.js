import gql from 'graphql-tag';

export default gql`
    mutation userReserveRetryByVariant($reserve_items: [ReserveRetryItemInput], $ticket_id: Int) {
        userReserveRetryByVariant(reserve_items: $reserve_items, ticket_id: $ticket_id) {            
            message
            success
            sc_variant_id
            variant_id
        }
    }
`