import gql from 'graphql-tag';

export default gql`
    mutation userChangePasswordSubUser($userChangePasswordSubUserInput: UserChangePasswordSubUserInput = {}) {
        userChangePasswordSubUser(userChangePasswordSubUserInput: $userChangePasswordSubUserInput) {
            message
            success            
        }
    }
`