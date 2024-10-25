import gql from 'graphql-tag';

export default gql`
    mutation userSyncProductFullfillment($userSyncProductFullfillmentInput: UserSyncProductFullfillmentInput!) {
        userSyncProductFullfillment(userSyncProductFullfillmentInput: $userSyncProductFullfillmentInput) {
            message
            success            
        }
    }
`