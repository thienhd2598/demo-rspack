import gql from 'graphql-tag';

export default gql`
    mutation userUpdateSubUserV2($userUpdateSubUserInput: UserUpdateSubUserInputV2 = {}) {
        userUpdateSubUserV2(userUpdateSubUserInput: $userUpdateSubUserInput) {
            message
            success            
        }
    }
`