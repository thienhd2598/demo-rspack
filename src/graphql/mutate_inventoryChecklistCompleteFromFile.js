import gql from 'graphql-tag';

export default gql`
    mutation inventoryChecklistCompleteFromFile($checkListId: Int!, $urlFile: String!) {
        inventoryChecklistCompleteFromFile(checkListId: $checkListId, urlFile: $urlFile) {
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