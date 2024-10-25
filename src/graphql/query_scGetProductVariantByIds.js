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
        id
        productAssets {
          id
          origin_image_url
          position
          ref_id
          ref_url
          sc_product_id
          sme_asset_id
          sme_url
          template_image_url
          type
        }
        ref_id
        name
        sync_status
      }
    }
  }
}
`