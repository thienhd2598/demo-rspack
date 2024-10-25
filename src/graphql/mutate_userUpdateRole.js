import gql from 'graphql-tag';

export default gql`
    mutation userUpdateRole($userUpdateRoleInput: UserUpdateRoleInput!) {
        userUpdateRole(userUpdateRoleInput: $userUpdateRoleInput) {
            message
            success            
        }
    }
`