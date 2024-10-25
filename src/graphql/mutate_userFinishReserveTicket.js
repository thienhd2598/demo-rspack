import gql from 'graphql-tag';

export default gql`
    mutation userFinishReserveTicket($ids: [Int]) {
        userFinishReserveTicket(ids: $ids) {            
            message
            success
            id
            ticket_name            
        }
    }
`