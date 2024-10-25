import gql from 'graphql-tag';

export default gql`
query sme_catalog_inventories($limit: Int = 10, $offset: Int = 0, $where: sme_catalog_inventories_bool_exp = {}, $order_by: [sme_catalog_inventories_order_by!] = {updated_at: desc}) {
  sme_catalog_inventories(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
    product_id
    sme_store_id
    status
    stock_actual
    stock_preallocate
    stock_allocated
    stock_available
    stock_reserve
    stock_shipping
    variant_id
    updated_at
    sme_store {
      id
      name
      is_default
    }
    items {
      stock_preallocate
    }
    product {
      sme_catalog_product_assets(where: {is_video: {_eq: "0"}}, order_by: {position_show: asc}) {
        asset_url
        id
        is_video
        position_show
      }
    }
    variant {
      id
      cost_price
      gtin
      name
      price
      price_minimum
      sku
      stock_warning
      is_combo
      combo_items {
        combo_item{
          id
          sku
          product_id
        }
        quantity
      }
      attributes {
        sme_catalog_product_attribute_value {
          name
          position
          sme_catalog_product_custom_attribute {
            display_name
            name
          }
        }
      }
      sme_catalog_product {
        name
      }
      sme_catalog_product_variant_assets {
        asset_url
      }
      inventories {
        stock_actual
        stock_available
        stock_reserve
        sme_store_id
        stock_allocated
        stock_shipping
        stock_preallocate
      }

      unit
    }
  }
}



`;
