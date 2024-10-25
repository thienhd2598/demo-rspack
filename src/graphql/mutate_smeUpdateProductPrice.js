import gql from 'graphql-tag';

export default gql`
    mutation userUpdateProductPrice($products: [ProductPriceInput] = []) {
        userUpdateProductPrice(products: $products) {
            message
            success
        }
    }
`;