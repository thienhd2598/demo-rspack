import gql from 'graphql-tag';

export default gql`
    mutation subUserRefreshToken($token: String!) {
        subUserRefreshToken(token: $token) {
            accessToken  
            refreshToken          
            message
            success            
        }
    }
`