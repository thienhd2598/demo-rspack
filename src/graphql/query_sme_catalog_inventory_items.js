import gql from "graphql-tag";

export default gql`
  query sme_catalog_inventory_items($order_by: [sme_catalog_inventory_items_order_by!] = {updated_at: desc,variant_id: desc}, $checklistid: Int, $limit: Int, $offset: Int = 0,$where: sme_catalog_inventory_items_bool_exp ={} ) {
  sme_catalog_inventory_items(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
    in_checklist(args: {checklistid: $checklistid})
    sme_store_id
    stock_actual    
    sme_store_id
    stock_allocated    
    stock_available
    stock_reserve
    sme_store {
      id
      allow_preallocate
      name
    }
    stock_shipping
    product_id
    variant_id
    stock_preallocate
    in_any_checklist_not_complete
    variant {
        id
        cost_price
        product_status_id
        product_status_code
        product_status_name
        is_multi_unit
        gtin
        name
        price
        is_combo
        price_minimum
        sku
        stock_warning
        combo_items {
          quantity        
          variant_id
          combo_variant_id
          combo_item {
            product_id
            id
            name
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
        inventory {
          stock_actual
          stock_allocated
          stock_available
          stock_preallocate
          stock_reserve
        }
        inventories {
          sme_store_id
          stock_actual
          stock_allocated
          stock_preallocate
          stock_reserve
          stock_shipping        
          stock_available
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
          id
          is_multi_unit
          sme_catalog_product_ship_package_infos {
            size_width
            size_length
            size_height
            weight
          }
        }
        sme_catalog_product_variant_assets {
          asset_url
        }
        unit
        variant_unit {
          description
          is_main
          main_variant_id
          name
          ratio
          ratio_type
        }
      }
  }
  sme_catalog_inventory_items_aggregate(where: $where)
 	{
      aggregate {
        count
      }
	}
}
`;
