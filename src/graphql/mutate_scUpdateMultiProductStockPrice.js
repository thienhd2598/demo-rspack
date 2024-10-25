import gql from 'graphql-tag';

export default gql`
    mutation scUpdateMultiProductStockPrice($products: [UpdateMultiProductStockPrice!] = {}) {
        scUpdateMultiProductStockPrice(products: $products) {
            list_fail {
                message
                product_id
                sku
            }
            message
            success
            total
            total_fail
            total_success
        }
    }
`;
