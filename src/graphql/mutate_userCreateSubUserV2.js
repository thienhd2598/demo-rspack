import gql from 'graphql-tag';

export default gql`
    mutation userCreateSubUserV2($userCreateSubUserInput: UserCreateSubUserInputV2 = {}) {
        userCreateSubUserV2(userCreateSubUserInput: $userCreateSubUserInput) {
            accessToken
            id
            message
            success            
        }
    }
`