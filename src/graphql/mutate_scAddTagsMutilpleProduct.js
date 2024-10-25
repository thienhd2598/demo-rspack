import gql from 'graphql-tag';

export default gql`
    mutation ScAddTagsMultipleProduct($product_ids: [Int!] = [], $tags: [ScProductTagsInput!] = []) {
        ScAddTagsMultipleProduct(product_ids: $product_ids, tags: $tags) {
            message
            success
        }
    }
`;