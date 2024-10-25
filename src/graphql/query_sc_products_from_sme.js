import gql from 'graphql-tag';

export default gql`
query sc_products($sme_product_id: String = "", $first: Int = 10, $page: Int) {
  sc_products(sme_product_id: $sme_product_id, first: $first, page: $page) {
    paginatorInfo {
      count
      currentPage
      total
      perPage
    }
    data {
      connector_channel_code
      id
      name
      price
      sku
      stock_on_hand
      package_height
      package_length
      package_weight
      package_width
      productVariants {
        connector_channel_code
        id
        name
        price
        ref_id
        sme_product_variant_id
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
      }
      productVariantAttributes {
        name
        id
      }
      variantAttributeValues {        
        sc_variant_attribute_id
        value
        id
      }
      ref_brand_id
      ref_brand_name
      ref_category_id
      ref_id
      ref_logistic_channel_id
      sc_brand_id
      sc_category_id
      sme_product_id
      status
      store_id
      sync_error_message
      synced_down_at
      sync_status
      warranty_period
      synced_up_at
      warranty_policy
      warranty_type
      sme_error_message
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
