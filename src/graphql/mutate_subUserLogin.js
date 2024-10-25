import gql from 'graphql-tag';

export default gql`
    mutation subUserLogin($subUserLoginInput: SubUserLoginInput = {}) {
        subUserLogin(subUserLoginInput: $subUserLoginInput) {
            accessToken  
            refreshToken          
            message
            success            
        }
    }
`