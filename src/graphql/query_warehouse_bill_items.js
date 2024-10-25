import gql from 'graphql-tag';

export default gql`
query warehouse_bill_items($limit: Int = 10, $offset: Int = 0, $where: warehouse_bill_items_bool_exp = {}, $order_by: [warehouse_bill_items_order_by!] = { updated_at: desc }) {
    warehouse_bill_items(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
        created_at
        discount_type
        discount_value
        is_include_stock_preallocate
        id
        price
        expired_info
        product {
          id
          is_combo
          name
          price          
          sku
        }
        product_id
        quantity
        quantity_plan
        note
        sme_id
        updated_at
        variant_id
        warehouse_bill_id
        stock_actual
        stock_available
        stock_preallocate
        variant {
            unit
            id
            attributes {
              sme_catalog_product_attribute_value {
                assets {
                  asset_url
                  asset_id
                }
                name
                id
              }
            }
            cost_price
            price
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
            product_id            
            is_combo
            sme_catalog_product_variant_assets {
              asset_url
            }
            combo_items {
              combo_item {
                name
                sku
              }
              combo_variant_id
              created_at
              quantity
              product_id
              sme_id
              variant_id
            }
            sku
            name
            sme_catalog_product {
              name
            }
          }
    }

    warehouse_bill_items_aggregate(where: $where) {
        aggregate {
          count
        }
    }
}`