import gql from 'graphql-tag';

export default gql`
query sc_product($id: Int!) {
  sc_product(id: $id) {
    id
    name
    sku
    price
    stock_on_hand
    sum_stock_on_hand
    store_id
    productVariants {
      id
      name
    }
    variantAttributeValues {
      id
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
  }
}
`