import gql from 'graphql-tag';

export default gql`
    mutation userCreateReserveTicket($userCreateReserveTicketInput: UserCreateReserveTicketInput = {}) {
        userCreateReserveTicket(userCreateReserveTicketInput: $userCreateReserveTicketInput) {
            data
            message
            success            
        }
    }
`