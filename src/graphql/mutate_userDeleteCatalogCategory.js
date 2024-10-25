import gql from 'graphql-tag';

export default gql`
    mutation userDeleteCatalogCategory($id: Int!) {
        userDeleteCatalogCategory(id: $id) {
            message
            success
        }
    }   
`