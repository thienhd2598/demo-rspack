import gql from 'graphql-tag';

export default gql`
query sc_product($id: Int!) {
  sc_product(id: $id) {
    warranty_type
    warranty_policy
    warranty_period
    synced_up_at
    synced_down_at
    sync_status
    sum_stock_on_hand
    sync_error_message
    store_id
    store {
      merge_stock
    }
    status
    platform_text_status
    sme_product_id
    sme_error_message
    sc_brand_id
    sc_category_id
    ref_url
    ref_logistic_channel_id
    ref_id
    ref_category_id
    ref_brand_name
    ref_brand_id
    special_type
    is_cod_open
    description_extend {
      field_type
      image_info {
        image_id
        image_url
        sme_url
      }
      text
    }
    scProductTag {
      id      
      sme_id
      tag_name
    }
    productVariants {
      connector_channel_code
      id
      name
      price
      price_minimum
      ref_id
      status
      sku
      merge_price
      merge_stock
      is_enable_link_inventory
      stock_allocated
      stock_on_hand
      sellable_stock
      reverse_stock
      asset_payload
      sc_product_attributes_value
      sme_product_variant_id
      variantInventoris {
        id
        inventory_change
        sc_variant_id
        sc_warehouse_id
        stock_on_hand
        store_id
      }
    }
    productAttributeValues {
      id
      ref_id
      op_sc_product_attribute_id
      ref_product_attribute_name
      status
      value
      asset_payload
      sc_option_id
      input_type
      attribute_type
      unit
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
      platform_message
      uploaded_at
      platform_processed_at
      type
      synced_up_at
    }
    package_width
    package_length
    package_weight
    package_height
    name
    is_valid_logistic
    id
    is_virtual
    connector_channel_code
    description
    description_html
    is_connected
    price
    video
    short_description
    sku
    stock_on_hand
    variantAttributeValues {
      id
      sc_variant_attribute_id
      sme_variant_attribute_value_id
      value
      ref_index
      sc_option_id
      sc_attribute_group_id
      ref_attribute_group_id
      scVariantValueAssets {
        id
        ref_id
        ref_url
        sc_variant_attribute_value_id
        sme_asset_id
        sme_url
        type
      }
      position
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
  sc_stores {
    connector_channel_code
    enable_multi_warehouse
    name
    id
    status
    special_type
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
