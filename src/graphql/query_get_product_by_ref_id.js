import gql from 'graphql-tag';

export default gql`
    query scGetProduct($ref_id: String!) {
        scGetProduct(ref_id: $ref_id) {
            id    
            name
            price
            ref_url
            sme_product_id
            productAssets {
              type
              sme_url
              ref_url
              position
              id
            }
            sku   
        }
    }
`