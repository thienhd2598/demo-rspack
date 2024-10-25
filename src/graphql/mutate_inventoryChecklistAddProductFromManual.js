import gql from 'graphql-tag';

export default gql`
    mutation inventoryChecklistAddProductFromManual($checkListId: Int!, $variantIds: [String]) {
        inventoryChecklistAddProductFromManual(checkListId: $checkListId, variantIds: $variantIds) {
            message
            success
        }
    }   
`