import gql from "graphql-tag";

export default gql`
  query sme_catalog_product_variant(
    $limit: Int = 200
    $offset: Int = 0
    $where: sme_catalog_product_variant_bool_exp = {}
    $order_by: [sme_catalog_product_variant_order_by!] = {}
  ) {
    sme_catalog_product_variant(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $order_by
    ) {
      id
      parent_variant_id
      stock_on_hand
      product_status_name
      product_status_id
      product_status_code
      name
      sku
      status
      in_any_checklist_not_complete
      is_combo
      cost_price
      price
      variant_unit {
        id
        name
      }
      provider_links {
        id
        provider_code
        provider_connected_id
        provider_sku
        provider_variant_id
        variant_id
      }
      variant_full_name
      inventories {
        sme_store_id
        stock_actual
        stock_allocated
        stock_preallocate
        stock_reserve
        stock_shipping        
        stock_available
      }
      sc_variant_linked {
        id
        sc_variant_id
        sme_variant_id
        store_id
        created_at
      }
      status_variants {
        id
        product_status_name
        sku
        product_status_code
        status
        unit
      }
      combo_items {
        quantity        
        variant_id
        combo_variant_id
        combo_item {
          product_id
          id
          name
          product_status_name
          unit
          status_variants {
            id
            status
            product_status_code
            product_status_name
            sku
            unit
          }
          status
          sku
          product_id
          inventories {
            sme_store_id
            stock_actual
            stock_allocated
            stock_reserve
            stock_preallocate
            stock_shipping
            stock_available
          }
          inventory {
            stock_actual
            stock_allocated
            stock_reserve
            stock_shipping
            stock_available
          }
          sme_catalog_product_variant_assets {
            asset_id
            asset_url
            id
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
              assets {
                position_show
                id
                asset_url
              }
            }
          }
          sme_catalog_product {
            id
            name
          }
        }
      }
      sme_catalog_product {
        id
        name
        sku
        is_combo
      }
      inventory {
        status
        stock_actual
        stock_reserve
        stock_available
        stock_allocated
        stock_available
        stock_shipping
        sme_store_id
        variant {
              cost_price
              price
            }
      }
      attributes {
        sme_catalog_product_attribute_value {
          name
          position
          sme_catalog_product_custom_attribute {
            display_name
            name
          }
          assets {
            position_show
            id
            asset_url
          }
        }
      }
      updated_at

      sme_catalog_product_variant_assets {
        asset_url
      }

      unit
    }

    sme_catalog_product_variant_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;
