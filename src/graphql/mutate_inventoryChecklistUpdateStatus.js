import gql from 'graphql-tag';

export default gql`
    mutation inventoryChecklistUpdateStatus($checkListId: Int!, $status: String!) {
        inventoryChecklistUpdateStatus(checkListId: $checkListId, status: $status) {
            message
            success
            error_items {
                checklistCode
                checklistId
                sku
                variantId
            }
        }
    }   
`