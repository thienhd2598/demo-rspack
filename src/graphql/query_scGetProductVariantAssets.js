import gql from 'graphql-tag';

export default gql`
    query scGetProductVariantAssets($product_variants: [VariantArrInput]!) {
        scGetProductVariantAssets(product_variants: $product_variants) {
            asset {
                type
                sme_url
                sme_asset_id
                sc_variant_attribute_value_id
                ref_url
                ref_id
                id
              }
            sc_product_id
            sc_variant_id
        }
    }
`