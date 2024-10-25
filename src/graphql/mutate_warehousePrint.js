import gql from 'graphql-tag';

export default gql`
    mutation warehousePrint($id: Int!) {
        warehousePrint(id: $id) {
            message
            success         
            data   
        }
    }
`