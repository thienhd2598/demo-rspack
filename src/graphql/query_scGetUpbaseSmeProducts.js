import gql from 'graphql-tag';

export default gql`
query scGetUpbaseSmeProducts($page: Int = 1, $per_page: Int = 10, $q: String = "", $store_id: Int = null, $sync_status: Int = null) {
  scGetUpbaseSmeProducts(page: $page, per_page: $per_page, q: $q,  store_id: $store_id, sync_status: $sync_status) {
    total
    products {
      connector_channel_code
      created_at
      id
      name
      package_height
      package_length
      package_weight
      package_width
      ref_brand_id
      ref_brand_name
      productVariants {
        connector_channel_code
        id
        name
        price
        ref_id
        sku
        stock_allocated
        stock_on_hand
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
      ref_category_id
      ref_id
      sc_brand_id
      sc_category_id
      status
      store_id
      sync_error_message
      sync_status
      warranty_period
      warranty_type
      warranty_policy
      synced_down_at
      synced_up_at
      sme_product_id
      sku
      variantAttributeValues {
        id
      }
    }
  }

  sc_stores {
    connector_channel_code
    name
    id
    status
  }
  op_connector_channels {
    code
    id
    logo_asset_id
    logo_asset_url
    name
  }
}

`;
