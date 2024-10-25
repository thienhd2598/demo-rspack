import gql from 'graphql-tag';

export default gql`
    query sc_product_variant($id: Int) {
        sc_product_variant(id: $id) {
            asset_payload
            sku
            id
            name
            value_asset {
                    id
                    sme_url
                }
            product {
                id
                name
                store_id
                productVariants {
                    sc_product_attributes_value
                    sme_product_variant_id
                    id
                }
                productVariantAttributes {
                    id
                    name
                    position
                    ref_index
                    sc_attribute_id
                    sme_variant_attribute_id
                    values
                }
                variantAttributeValues {
                    sc_variant_attribute_id
                    ref_index
                    value
                }
            }
        }
    }
`