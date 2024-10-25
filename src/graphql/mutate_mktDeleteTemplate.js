import gql from "graphql-tag";

export default gql`
    mutation mktDeleteTemplate($list_template_id: [Int]) {
        mktDeleteTemplate(list_template_id: $list_template_id) {
            message
            success
        }
    }
`;