import gql from 'graphql-tag';

export default gql`
    mutation inventoryChecklistCreate($inventoryChecklistCreateInput: InventoryChecklistCreateInput!) {
        inventoryChecklistCreate(inventoryChecklistCreateInput: $inventoryChecklistCreateInput) {
            message
            success
            id
        }
    }
`