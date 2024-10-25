import gql from "graphql-tag";

export default gql`
    mutation mktApprovedTemplate($id: Int) {
        mktApprovedTemplate(id: $id) {
            message
            success
        }
    }
`;