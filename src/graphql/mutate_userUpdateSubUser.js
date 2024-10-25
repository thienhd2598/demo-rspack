import gql from 'graphql-tag';

export default gql`
    mutation userUpdateSubUser($userUpdateSubUserInput: UserUpdateSubUserInput = {}) {
        userUpdateSubUser(userUpdateSubUserInput: $userUpdateSubUserInput) {
            message
            success            
        }
    }
`