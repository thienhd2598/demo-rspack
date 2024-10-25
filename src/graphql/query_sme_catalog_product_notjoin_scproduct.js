import gql from 'graphql-tag';

export default gql`
query sme_catalog_product($limit: Int = 10, $offset: Int = 0, $where: sme_catalog_product_bool_exp = {}, $order_by: [sme_catalog_product_order_by!] = {id: asc}) {
  sme_catalog_product(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
    catalog_category_id
    id
    name
    slug
    name_seo
    sku
    total_stock_on_hand
    stock_on_hand
    price
    video_url
    is_combo
    combo_items {
      combo_item{
        id
        sku
        product_id
        inventory {
          stock_actual
        }
      }
      quantity
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
    sme_catalog_product_attributes_custom {
      display_name
      id
    }
    sme_catalog_product_assets {
      asset_id
      asset_url
      catalog_product_id
      created_at
      id
      is_video
      position_show
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
    sme_catalog_product_variants (where : {status: {_eq: 10}}){
      inventories {
        sme_store {
          id
          is_default
          name
        }
        stock_actual
        sme_store_id
        stock_available
        stock_allocated
        stock_shipping
        stock_preallocate
      }      
      id
      name
      position_in_product
      price
      price_minimum
      cost_price
      product_id
      sku
      sme_id
      status
      stock_allocated
      stock_on_hand
      sc_product_variant {
        sellable_stock
      }
      provider_links {
        id
        provider_code
        sync_error_msg
        variant_id
      }
      track_inventory
      tree_level
      tree_parrent_id
      product_status_id
      tree_status
      vat_rate
      variant_unit {
        id
      }
      is_combo
      combo_items {
        combo_item{
          id
          sku
          product_id
        }
        quantity
      }
      sc_variant_linked_aggregate {
        aggregate {
          count
        }
      }
      sc_variant_linked {
        id
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
            asset_url
            created_at
            id
            is_video
            product_attribute_value_id
            position_show
          }
        }
      }
      inventory {
        stock_actual
        stock_available
        stock_allocated
      }
    }
    brand_id
    updated_at
    created_at
    description
    description_html
    description_short
    description_extend

    scProductMapping {
      id
      sc_product_id
      sme_product_id
      store_id
    }
  }
  sme_catalog_product_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}



`;
