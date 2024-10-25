import gql from 'graphql-tag';

export default gql`
query sc_products($status: Int = null, $store_id: Int = null, $sync_status: Int = null, $q: String = "", $first: Int = 25, $page: Int = 1, $sme_error: Int = null) {
  sc_products(sync_status: $sync_status, status: $status, store_id: $store_id, q: $q, first: $first, page: $page, sme_error: $sme_error) {
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
      sku
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
}


`;
