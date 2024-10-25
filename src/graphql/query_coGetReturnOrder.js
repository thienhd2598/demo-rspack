import gql from "graphql-tag";

export default gql`
  query coGetReturnOrder($q: String, $search_type: String,$context: String) {
    coGetReturnOrder(q: $q, search_type: $search_type, context: $context) {
      success
      message
      data {
        id
        tracking_number
        ref_return_id
        store_id
        refund_total
        order_id
        connector_channel_code
        order {
          ref_id
          fulfillment_provider_type
          ref_store_id
        }
        returnWarehouseImport {
          import_type
        }
        returnOrderItems {
          id
          return_quantity
          orderItem {
            comboItems {
              order_item_transaction_id
              sme_variant_id
              purchased_quantity
            }
            sc_variant_id
            connector_channel_code
            created_at
            is_combo
            paid_price
            quantity_purchased
            variant_sku
            ref_product_id
            ref_variant_id
            sme_variant_id
            product_name
            variant_image
          }
        }
      }
    }
  }
`;
