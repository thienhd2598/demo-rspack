import gql from 'graphql-tag';

export default gql`
    mutation userSyncInventoryFullfillment($userSyncProductFullfillmentInput: UserSyncProductFullfillmentInput!) {
        userSyncInventoryFullfillment(userSyncProductFullfillmentInput: $userSyncProductFullfillmentInput) {
            message
            success            
        }
    }
`