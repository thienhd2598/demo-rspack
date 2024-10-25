import gql from 'graphql-tag';

export default gql`
    query scGetProductVariantLinked($list_sme_variant_id: [String]) {
        scGetProductVariantLinked(list_sme_variant_id: $list_sme_variant_id) {
            data {
                sme_variant_id
                total
                sc_variants {
                  asset_payload
                  connector_channel_code
                  id
                  name
                  ref_id
                  price
                  sc_product_attributes_value
                  product {
                    name
                    price
                    sku
                    id
                    stock_on_hand
                    productVariants {
                      asset_payload
                      id
                      name
                      sc_product_attributes_value
                    }
                    variantAttributeValues {
                        value
                        id
                        position
                        sc_variant_attribute_id
                        sme_variant_attribute_value_id
                        ref_index
                        scVariantValueAssets {                          
                          sme_url
                        }
                    }                    
                    productAssets {
                        id
                        ref_id
                        ref_url
                        sc_product_id
                        sme_asset_id
                        sme_url
                        type
                        position
                        origin_image_url
                        template_image_url
                      }

                      productVariantAttributes {
                        id
                        name
                        sme_variant_attribute_id
                        values
                        ref_index
                        sc_attribute_id
                        position
                    }
                  }
                  sku
                  stock_on_hand
                  storeChannel {
                    id
                    name
                  }
                }                
              }
        }
    }
`;