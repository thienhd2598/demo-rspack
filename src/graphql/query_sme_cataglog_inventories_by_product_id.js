import gql from 'graphql-tag';

export default gql`
query query_sme_cataglog_inventories_by_product_id($product_id: uuid!) {
    sme_catalog_inventories(where: {product_id: {_eq: $product_id}}) {
      is_near_out_stock
      is_out_stock
      items {
        sme_store {
          name
        }
        stock_actual
        stock_available
        stock_reserve
        stock_allocated
        stock_shipping
        updated_at
        variant_id
      }
      product {
        id
        name
        sku
        sme_catalog_product_assets(where: {is_video: {_eq: "0"}}, order_by: {position_show: asc}) {
          asset_url
          id
          is_video
          position_show
        }
      }
      status
      stock_actual
      stock_available
      stock_reserve
      stock_allocated
      stock_shipping
      updated_at
      variant {
        name
        id
        sc_variant_linked {
          id
          sc_variant_id
          sme_variant_id
        }
        attributes {
          id
          sme_catalog_product_attribute_value {
            name
            position
            sme_catalog_product_custom_attribute {
              display_name
              name
            }
          }
        }
        cost_price
        gtin
        is_out_stock
        is_near_out_stock
        name
        price
        price_minimum
        sku
        status
        stock_allocated
        stock_on_hand
        stock_warning
        track_inventory
        sme_catalog_product_variant_assets(where: {type: {_eq: 0}}) {
          asset_id
          asset_url
          created_at
          position_show
          id
          type
          product_variant_id
        }
      }
    }
  }
  

`;
