import gql from "graphql-tag";

export default gql`
query sme_catalog_product_variant_by_pk($id: uuid!) {
    sme_catalog_product_variant_by_pk(id: $id) {
      id
      sku
      name
      unit
      inventory {
        stock_actual
        stock_available
        stock_reserve
        stock_allocated
        stock_shipping
      }
      inventories {
        sme_store_id
        stock_actual
        stock_available
        stock_reserve
        stock_allocated
        stock_preallocate
        stock_shipping
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
        status
      }
      sme_catalog_product_variant_assets {
        asset_url
      }
      attributes {
        sme_catalog_product_attribute_value {
          name
          id
        }
      }
      sme_catalog_product {
        id
        name
        is_combo
        combo_items {
          combo_item {
            id
            sku
            product_id
          }
          quantity
        }
        sme_catalog_product_variants {
          id
          attributes {
            sme_catalog_product_attribute_value {
              name
              position
              sme_catalog_product_custom_attribute {
                display_name
                name
              }
              assets {
                asset_url
                position_show
              }
            }
          }
        }
      }
    }
  }
`