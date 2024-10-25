import gql from 'graphql-tag';

export default gql`
    mutation userCreateSubUser($userCreateSubUserInput: UserCreateSubUserInput = {}) {
        userCreateSubUser(userCreateSubUserInput: $userCreateSubUserInput) {
            accessToken
            id
            message
            success            
        }
    }
`