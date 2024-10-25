import gql from "graphql-tag";

export default gql`
  mutation coValidateExcelImportWarehouse(
    $file_url: String!
    $type_return: Int!
  ) {
    coValidateExcelImportWarehouse(
      file_url: $file_url
      type_return: $type_return
    ) {
      list_error {
        error_msg
        tracking_number
      }
      list_pass {
        
        logisticsPackages {
          tracking_number
          connector_channel_code
          id
          store_id
          ref_order_id
          order {
            ref_store_id
            ref_id
          }
          orderItems {
            comboItems {
              connector_channel_code
              id
              order_item_id
              purchased_quantity
              sme_variant_id
              store_id
            }
            connector_channel_code
            id
            is_combo
            order_id
            product_name
            quantity_purchased
            ref_order_id
            ref_product_id
            ref_variant_id
            sc_product_id
            sc_variant_id
            sme_product_id
            sme_variant_id
            store_id
            variant_image
            variant_name
            variant_sku
          }
        }
      }
      message
      success
      total
      total_error
      total_success
    }
  }
`;
