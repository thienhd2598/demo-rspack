import gql from 'graphql-tag';

export default gql`
    mutation userReserveRetryByTicket($ids: [Int]) {
        userReserveRetryByTicket(ids: $ids) {            
            sc_variant_id
            id
            message
            success
            variant_id
        }
    }
`