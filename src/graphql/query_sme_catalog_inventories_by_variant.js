import gql from 'graphql-tag';

export default gql`
query sme_catalog_inventories_by_variant($variant_id: uuid!) {
    sme_catalog_inventories(where: {variant_id: {_eq: $variant_id}}) {
      is_near_out_stock
      is_out_stock
      items {
        sme_store {
          name
        }
        stock_actual
        stock_available
        stock_preallocate
        stock_reserve
        stock_allocated
        stock_shipping
        updated_at
        variant_id
      }
      product {
        sme_catalog_product_variants {
          id
          is_multi_unit
          provider_links {
            provider_code
            id
            sync_error_msg
          }
        }
        id
        name
        sku
        sme_catalog_product_assets(where: {is_video: {_eq: "0"}}, order_by: {position_show: asc}) {
          asset_url
          id
          is_video
          position_show
        }
        scProductMapping {
          sc_product_id
          sme_product_id
          store_id
          id
        }
        scProductMapping_aggregate {
          aggregate {
            count
          }
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
        provider_links {
          id
          provider_sku
          provider_code
          sync_error_msg
        }
        variant_full_name
        vat_rate
        name
        id
        product_status_id
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
        unit
        variant_unit {
          name
          main_variant_id
        }
      }
    }
  }
  

`;
