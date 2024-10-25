import gql from 'graphql-tag';

export default gql`
    mutation userSyncAllProductFromFullfillment($providerConnectedId: Int) {
        userSyncAllProductFromFullfillment(providerConnectedId: $providerConnectedId) {
            message
            success            
        }
    }
`