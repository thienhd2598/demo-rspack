import gql from 'graphql-tag';

export default gql`
query ScGetSmeProducts($connector_channel_code: String = null, $prefix_name: String, $page: Int = 1, $per_page: Int = 10, $q: String = "", $sc_category_id: Int = null, $status: Int = null, $store_id: Int = null, $sync_status: Int = null, $order_by: OrderBy = null, $stock: Int = null, $filter_ref_id: Int = null, $filter_map_sme: Int = null, $is_draft: Int = null, $tag_name: String = "", $has_origin_img: Int = null, $is_virtual: Int) {
  ScGetSmeProducts(connector_channel_code: $connector_channel_code, prefix_name: $prefix_name, page: $page, per_page: $per_page, q: $q, sc_category_id: $sc_category_id, status: $status, store_id: $store_id, sync_status: $sync_status, stock: $stock, filter_ref_id: $filter_ref_id, order_by: $order_by, filter_map_sme: $filter_map_sme, is_draft: $is_draft, tag_name: $tag_name, has_origin_img: $has_origin_img, is_virtual: $is_virtual) {
    total
    products {
      connector_channel_code
      created_at
      updated_at
      id
      name
      sku
      merge_price
      merge_stock
      platform_status
      platform_text_status
      package_height
      package_length
      package_weight
      package_width
      ref_brand_id
      ref_logistic_channel_id
      ref_brand_name
      ref_url
      sum_stock_on_hand
      productVariants {
        connector_channel_code
        id
        name
        price
        price_minimum
        ref_id
        sku
        sellable_stock
        stock_allocated
        stock_on_hand
        sc_product_attributes_value
        sme_product_variant_id
        status
        merge_price
        merge_stock
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
      sme_product_id      
      price
      description
      description_html
      short_description
      variantAttributeValues {
        id
        ref_index
        sme_variant_attribute_value_id
        sc_variant_attribute_id
        value
        scVariantValueAssets {
          id
          ref_id
          ref_url
          sc_variant_attribute_value_id
          sme_asset_id
          sme_url
          type
        }
      }
      scProductTag {
        id
        sme_id
        tag_name
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
      stock_on_hand
    }
  }
  sc_stores {
    connector_channel_code
    name
    id
    enable_multi_warehouse
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
