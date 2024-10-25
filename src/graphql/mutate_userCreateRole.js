import gql from 'graphql-tag';

export default gql`
    mutation userCreateRole($userCreateRoleInput: UserCreateRoleInput = {}) {
        userCreateRole(userCreateRoleInput: $userCreateRoleInput) {            
            message
            success            
        }
    }
`