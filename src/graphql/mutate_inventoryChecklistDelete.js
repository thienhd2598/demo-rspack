import gql from 'graphql-tag';

export default gql`
    mutation inventoryChecklistDelete($checkListId: Int!) {
        inventoryChecklistDelete(checkListId: $checkListId) {
            message
            success
        }
    }   
`