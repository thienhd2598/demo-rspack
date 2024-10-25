import gql from 'graphql-tag';

export default gql`
    mutation inventoryChecklistAddProductFromFile($checkListId: Int!, $urlFile: String!) {
        inventoryChecklistAddProductFromFile(checkListId: $checkListId, urlFile: $urlFile) {
            message
            success
            results{
                index
                message
                sku
            }
            total
            totalSuccess
        }
    }   
`