import gql from 'graphql-tag';

export default gql`
query sme_catalog_product($limit: Int = 10, $offset: Int = 0, $where: sme_catalog_product_bool_exp = {}, $order_by: [sme_catalog_product_order_by!] = {id: asc}) {
  sme_catalog_product(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
    catalog_category_id
    id
    name
    name_seo
    slug
    sku
    stock_on_hand
    price
    video_url
    is_combo
      combo_items {
        combo_item{
          id
          sku
          product_id
        }
        quantity
      }
    scProduct {
      connector_channel_code
      store_id
      id
      name
      sku
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
    sme_catalog_product_variants {
      id
      name
      position_in_product
      price
      product_id
      sku
      sme_id
      status
      stock_allocated
      stock_on_hand
      track_inventory
      tree_level
      tree_parrent_id
      tree_status
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
    }
    brand_id
    updated_at
    created_at
    description
    description_html
    description_short
    description_extend
  }
  sme_catalog_product_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}



`;
