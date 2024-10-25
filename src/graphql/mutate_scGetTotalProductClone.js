import gql from 'graphql-tag';

export default gql`
    mutation scGetTotalProductClone($store_id: Int!, $clone_product_type: Int!) {
        scGetTotalProductClone(store_id: $store_id, clone_product_type: $clone_product_type) {
            success
            total
            message   
        }
    }
`