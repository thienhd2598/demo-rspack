import gql from "graphql-tag";

export default gql`
  query coGetPackage($search_type: String, $q: String, $context: String, $sme_warehouse_id: Int) {
    coGetPackage(search_type: $search_type, q: $q,context: $context, sme_warehouse_id: $sme_warehouse_id) {
      data {
        id
        tracking_number
        order_id
        system_package_number
        package_number
        shipping_carrier
        total_purchased
        sme_warehouse_id
        print_status
        count_variant
        pack_status
        store_id
        pack_no
        ref_order_id
        order {
          connector_channel_code
          id
          payment_method
          store_id
          fulfillment_provider_type
          paid_price
          source
          logistic_fail
          returnWarehouseImport {
            id
          }
          status
          sme_id
          ref_store_id
          ref_number
          ref_id
        }
        orderItems {
          comboItems {
            order_item_transaction_id
            purchased_quantity
          }
          order_item_transaction_id
          connector_channel_code
          id
          order_id
          is_combo
          product_name
          quantity_purchased
          ref_order_id
          ref_product_id
          ref_variant_id
          variant_name
          variant_image
          variant_sku
          sc_product_id
          sc_variant_id
          sme_id
          store_id
          sme_product_id
          sme_variant_id
          is_combo
          comboItems {
            id
            order_item_transaction_id
            order_item_id
            sme_variant_id
            purchased_quantity
          }
        }
       
      }
      message
      success
    }
  }
`;
