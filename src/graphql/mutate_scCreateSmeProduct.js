import gql from 'graphql-tag';

export default gql`
    mutation scCreateSmeProduct($sc_product_id: Int!, $store_id: Int!) {
        scCreateSmeProduct(store_id: $store_id, sc_product_id: $sc_product_id) {
            success
            message
        }
    }
`;