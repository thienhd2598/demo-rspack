import gql from 'graphql-tag';

export default gql`
    mutation scUnLinkMultipleProduct($sc_product_ids: [Int!] = []) {
        scUnLinkMultipleProduct(sc_product_ids: $sc_product_ids) {
            message
            success
        }
    }
`;