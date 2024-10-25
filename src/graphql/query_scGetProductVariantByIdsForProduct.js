import gql from 'graphql-tag';

export default gql`query scGetProductVariantByIds($ids: [Int]) {
  scGetProductVariantByIds(ids: $ids) {
    variants {
      id
      price
      price_minimum      
      name
      sc_product_id
      ref_id
      ref_product_id
      stock_on_hand
      reverse_stock
      sellable_stock      
      sku
      name
      product {
        connector_channel_code
        created_at
        updated_at
        id
        name
        ref_id
        sum_sellable_stock
        sku      
        platform_status
        ref_logistic_channel_id
        platform_text_status            
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
        productVariants {
          id
          name
          sku
          ref_id
          price_minimum
          price
          sellable_stock
        }
        status
        store_id            
        scProductTag {
          id
          sme_id
          tag_name
        }
      }
    }
  }
}
`