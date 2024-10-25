import gql from 'graphql-tag';

export default gql`
query warehouse_inventory_transactions($limit: Int = 10, $offset: Int = 0, $where: warehouse_inventory_transactions_bool_exp = {}, $order_by: [warehouse_inventory_transactions_order_by!] = { created_at: desc }) {
    warehouse_inventory_transactions(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
      amount      
      created_at      
      id                      
      sme_id
      sme_warehouse_id
      type
      target
      action_name
      actor
      actor_ref
      actor_ref_code
      actor_type
      after
      before
      order_code
      order_tracking_number
      variant {
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
        unit
      }
      warehouse {
        id
        is_default
        name
        sme_id
      }      
      warehouseBill {
        logisticCode
        shipping_code
        order_code
      }      
    }
    warehouse_inventory_transactions_aggregate(where: $where) {
      aggregate {
        count
      }
  }
}



`;
