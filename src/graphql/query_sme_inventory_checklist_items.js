import gql from "graphql-tag";

export default gql`
  query sme_inventory_checklist_items(
    $limit: Int = 10
    $offset: Int = 0
    $where: sme_inventory_checklist_items_bool_exp
  ) {
    sme_inventory_checklist_items(
      limit: $limit
      offset: $offset
      where: $where
    ) {
      id
      stock_quantity
      stock_actual      
      stock_draft
      note
      variant_id
      is_khop
      status
      error_message
      variant {
        cost_price
        gtin
        name
        price
        price_minimum
        sku
        stock_warning
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
          id
          name
        }
        sme_catalog_product_variant_assets {
          asset_url
        }
        unit
      }
    }

    sme_inventory_checklist_items_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;
