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
        returnOrder {
          id
          order_id
          ref_return_id
          connector_channel_code
          order {
            ref_store_id
            ref_id
          }
          returnOrderItems {
            connector_channel_code
            id
            item_price
            orderItem {
              comboItems {
                connector_channel_code
                id
                order_item_id
                purchased_quantity
                sme_id
                sme_variant_id
                store_id
              }
              connector_channel_code
              id
              is_combo
              order_id
              product_name
              quantity_purchased
              sc_product_id
              sc_variant_id
              ref_product_id
              ref_variant_id
              sme_product_id
              sme_variant_id
              store_id
              variant_image
              variant_name
              variant_sku
            }
            order_id
            order_item_id
            ref_product_id
            ref_variant_id
            return_order_id
            return_quantity
            sme_id
            sme_variant_id
            store_id
          }
          store_id
          tracking_number
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
