import gql from 'graphql-tag';

export default gql`
    mutation scUpdateManualProductVariantInventory($products: [ManualProductVariantInventory!]!) {
        scUpdateManualProductVariantInventory(products: $products) {
            message
            success     
        }
    }
`