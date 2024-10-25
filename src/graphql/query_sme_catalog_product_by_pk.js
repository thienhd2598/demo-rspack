import gql from 'graphql-tag';

export default gql`
query sme_catalog_product_by_pk($id: uuid!, $skip: Boolean = false) {
  sme_catalog_product_by_pk(id: $id) @skip(if: $skip) {
    catalog_category_id
    outbound_method
    expired_stop_sale_days
    expired_warning_days
    id
    name
    slug
    sku
    price
    name_seo
    brand_name
    catalog_category_id
    is_expired_date
    is_lot
    serial_type
    total_stock_on_hand
    stock_on_hand
    has_order
    description_extend
    is_combo
    combo_items {
      quantity
      variant_id
      cost_allocate_ratio
      cost_ratio_value
      combo_item {
        id
        name
        sku
        inventories {
          stock_actual
          stock_available
          stock_reserve
          stock_preallocate
          sme_store_id
        }
        inventory {
          stock_actual
          stock_available
          stock_reserve
          stock_preallocate
          stock_allocated
          stock_shipping
          variant {
              cost_price
              price
          }
        }
        
        sme_catalog_product_variant_assets {
          asset_id
          asset_url
          id
        }
        attributes {
          id
        }
        sme_catalog_product {
          id
          name
        }
      }
    }
    tags {
      tag {
        created_at
        id
        sme_id
        title
        updated_at
      }
      created_at
      id
      product_id
      tag_id
      updated_at
    }    
    warranty_policy
    warranty_time
    warranty_type
    sme_catalog_product_assets {
      asset_id
      asset_url
      catalog_product_id
      created_at
      id
      is_video
      position_show
    }
    sme_catalog_product_attribute_values {
      asset_code
      created_at
      id
      name
      product_attribute_custom_id
      product_attribute_id
      product_id
      ref_index
      sme_catalog_product_custom_attribute {
        attribute_options
        catalog_product_id
        created_at
        display_name
        id
        name
        ref_index
        sme_id
      }
      op_catalog_product_attribute {
        category_id
        display_name
        has_asset
        id
        input_type
        is_mandatory
        name
        attribute_type
        options {
          name
        }
      }
      assets {
        asset_id
        position_show
        asset_url
        id
        is_video
        product_attribute_value_id
      }
      position
    }
    sme_id
    sme_catalog_product_ship_package_infos {
      box_info
      catalog_product_id
      created_at
      dangerous_goods
      id
      size_height
      size_length
      size_width
      weight
    }
    status
    is_multi_unit
    sme_catalog_product_variants {
      id
      name
      position_in_product
      price      
      stock_warning
      track_inventory
      vat_rate
      price_minimum
      gtin
      cost_price
      product_id
      product_status_id
      sku
      sme_id
      status
      stock_allocated
      stock_on_hand      
      track_inventory
      tree_level
      tree_parrent_id
      tree_status
      is_multi_unit
      unit
      provider_links {
        id
        provider_code
        provider_connected_id
        provider_sku
        provider_variant_id
        variant_id
        sync_error_msg
      }
      variant_unit {
        created_at
        description
        id
        is_main
        main_variant_id
        name
        product_id
        ratio
        ratio_type
        sme_id
        updated_at
        variant_id
      }
      sc_variant_linked {
        id
      }
      inventories {
        sme_store {
          id
          name
          is_default
        }
        sme_store_id
        stock_actual
        stock_available
        stock_preallocate
        stock_reserve
        stock_allocated
        stock_preallocate
        stock_shipping
        variant {
          id
          parent_variant_id
          product_status_code
          product_status_id
          product_status_name
        }
      }
      inventory {
        sme_store_id
        stock_actual
        stock_available
        stock_reserve
        stock_preallocate
        stock_allocated
        stock_shipping
      }
      attributes {
        id
        product_attribute_value_id
        product_attribute_value_ref_index
        product_variant_id
        sme_catalog_product_attribute_value {
          asset_code
          id
          name
          product_attribute_custom_id
          product_attribute_id
          product_id
          ref_index
          op_catalog_product_attribute {
            attribute_type
            category_id
            display_name
            has_asset
            id
            is_mandatory
            name
            input_type
            options {
              name
            }
          }
          sme_catalog_product_custom_attribute {
            attribute_options
            catalog_product_id
            created_at
            id
            display_name
            name
            ref_index
            sme_id
          }
          assets {
            asset_id
            position_show
            asset_url
            created_at
            id
            is_video
            product_attribute_value_id
          }
          position
        }
      }
    }
    brand_id
    updated_at
    created_at
    description
    description_html
    description_short
    video_url
    sme_catalog_product_attributes_custom {
      attribute_options
      catalog_product_id
      created_at
      display_name
      name
      id
      ref_index
    }
    scProductMapping {
      sc_product_id
      sme_product_id
      store_id
      id
    }
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
