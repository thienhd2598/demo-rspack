import gql from "graphql-tag";

export default gql`    
    mutation coExportSessionPick($id: Int!) {
        coExportSessionPick(id: $id) {
            file_name
            message
            success
            url
        }
    }
`;