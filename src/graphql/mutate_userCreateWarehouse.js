import gql from 'graphql-tag';

export default gql`
    mutation userCreateWarehouse($userCreateWarehouseInput: UserCreateWarehouseInput! = {}) {
        userCreateWarehouse(userCreateWarehouseInput: $userCreateWarehouseInput) {
            id
            message
            success
        }
    }   
`