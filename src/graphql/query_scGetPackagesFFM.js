import gql from "graphql-tag";

export default gql`
  query scGetPackages(
    $order_by: String
    $order_by_type: String
    $page: Int!
    $per_page: Int!
    $search: SearchPackage = {}     
  ) {
    scGetPackages(
        order_by: $order_by
        order_by_type: $order_by_type
        page: $page
        per_page: $per_page
        search: $search
    ) {
    store_id
    connector_channel_code
    created_at
    pack_no
    is_sio
    tracking_number
    sc_warehouse_id
    provider_or_error
    pack_status
    shipment_label_status
    warehouse_error_message
    logistic_provider_error
    system_package_number
    connector_channel_error
    shipping_carrier
    shipping_type
    package_number
    print_status
    order {
      tts_expired
      expiring_soon
      sync_error
      fulfillment_provider_type
      returnWarehouseImport {
        store_id
      }
      returnOrder {
        store_id
        order_id
        ref_return_id
        connector_channel_code
        tracking_number
        returnOrderItems {
          id
          order_id
          sme_variant_id
          return_quantity
          connector_channel_code
          order_item_id
        }
        returnWarehouseImport {
          import_images
          import_note
          import_type
          returnWarehouseImportItems {
            import_quantity
            return_quantity
            sme_combo_variant_id
            sme_variant_id
          }
          reason_note
          sme_warehouse_id
          store_id
          type_return
        }
      }
      
      logistic_fail
      connector_channel_code
      orderItems {
        order_item_transaction_id
        connector_channel_code
        created_at
        id
        order_id
        original_price
        paid_price
        product_name
        quantity_purchased
        reason
        reason_detail
        ref_order_id
        ref_product_id
        ref_variant_id
        variant_name
        variant_image
        variant_sku
        sc_product_id
        sc_variant_id
        store_id
        updated_at
        sme_product_id
        sme_variant_id
        is_combo
        comboItems {
          id
          connector_channel_code
          order_item_id
          purchased_quantity
          order_item_transaction_id
          sme_id
          sme_variant_id
          store_id
          warehouse_step
        }
      }
      source
      shipment_param_payload {
        pickup {
          address_list {
            address_id
            address_flag
            address
            city
            district
            state
            time_slot_list {
              date
              time_text
              pickup_time_id
            }
          }
        }
      }
      sme_note
      status
      payment_method
      logisticsPackages {
        pack_status
      }
      id
      ref_id
      order_at
      ref_store_id
      p_delivery_method
      customerRecipientAddress {
        full_name
        state
      }
      paid_price
      shipped_at
    }
    id
    sme_warehouse_id
    orderItems {
      order_item_transaction_id
      ref_product_id
      ref_variant_id
      is_gift
      connector_channel_code
      product_name
      variant_name
      warehouse_error_message
      variant_image
      variant_sku
      quantity_purchased
      sme_variant_id
      sc_variant_id
    }
  }
  scPackageAggregate(search: $search) {
    count
  }    
}
`;