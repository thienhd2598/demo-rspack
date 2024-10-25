import gql from 'graphql-tag';

export default gql`
    mutation inventoryChecklistAddProductFromFilter($checkListId: Int!, $filter: FilterInput) {
        inventoryChecklistAddProductFromFilter(checkListId: $checkListId, filter: $filter) {
            message
            success
        }
    }   
`