import gql from 'graphql-tag';

export default gql`
    mutation updateProductTagMulti($products: [SmeProductUpdateTag] = []) {
        updateProductTagMulti(products: $products) {
            message
            success
        }
    }
`;