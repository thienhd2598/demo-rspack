import gql from 'graphql-tag';

export default gql`
    query ScTags($tag_name: String = "") {
        ScTags(tag_name: $tag_name) {
            id            
            sme_id
            tag_name            
        }
    }
`;
