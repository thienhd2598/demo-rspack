import gql from 'graphql-tag';

export default gql`
    mutation scUpdateMultiProductImage($products: [UpdateMultiProductImageInput!] = {}) {
        scUpdateMultiProductImage(products: $products) {
            message
            success
        }
    }
`;
