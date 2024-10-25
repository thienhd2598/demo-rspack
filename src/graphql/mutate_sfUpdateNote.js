import gql from 'graphql-tag';

export default gql`
    mutation sfUpdateNote($id: Int!, $note: String) {
        sfUpdateNote(id: $id, note: $note) {            
            message
            success
        }
    }
`;