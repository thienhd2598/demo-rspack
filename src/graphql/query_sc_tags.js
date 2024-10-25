import gql from 'graphql-tag';

export default gql`
    query ScTags($sme_id: Int, $tag_name: String) {
        ScTags(sme_id: $sme_id, tag_name: $tag_name) {
            id,
            product_id,
            tag_name,
            position,
            sme_id,
        }
    }
`;