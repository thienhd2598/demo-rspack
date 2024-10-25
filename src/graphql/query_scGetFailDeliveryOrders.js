import gql from "graphql-tag";

export default gql`
  query scGetFailDeliveryOrders(
    $search: SearchFailDeliveryOrder = {}
    $page: Int!
    $per_page: Int!
    $order_by: String
    $order_by_type: String
    $context: String
  ) {
    scGetFailDeliveryOrders(
      search: $search
      page: $page
      per_page: $per_page
      order_by: $order_by
      order_by_type: $order_by_type
    ) {
      sync_error
      buyer_cancel_reason
      cancel_by
      connector_channel_code
      created_at
      order_at
      currency_code
      tts_expired
      source
      fulfillment_provider_type
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
      customer {
        connector_channel_code
        created_at
        full_name
        id
        phone
        ref_id
        user_name
        updated_at
      }
      customer_id
      id
      is_paid
      message_to_seller
      note
      platform_status_text
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
        sme_id
        store_id
        updated_at
        sme_product_id
        sme_variant_id
        warehouse_error_code
        warehouse_error_message
        is_combo
        comboItems {
          id
          connector_channel_code
          order_item_id
          order_item_transaction_id
          purchased_quantity
          sme_id
          sme_variant_id
          store_id
          warehouse_error_code
          warehouse_error_message
          warehouse_last_action
          warehouse_step
        }
      }
      original_price
      paid_price
      payment_method
      platform_status
      promotion_platform_amount
      promotion_seller_amount
      customerRecipientAddress {
        city
        connector_channel_code
        created_at
        customer_id
        district
        full_address
        full_name
        id
        phone
        region
        state
        town
        updated_at
        zip_code
      }
      logisticsPackages {
        id
        tracking_number
        package_number
        shipping_carrier
        print_status
        pack_status
        pack_abnormal
        warehouse_step
        connector_channel_error
        warehouse_error_message
      }
      updated_at
      update_time
      store_id
      status
      sme_id
      shipping_original_fee
      shipping_discount_seller_fee
      shipping_discount_platform_fee
      ref_store_id
      ref_number
      ref_id
      recipient_address_id
      p_delivery_method
      cancel_reason
      logistic_fail
      return_process_status
      returned_time
      returnWarehouseImport {
        id
        sme_warehouse_id
        import_note
        import_type
        reason_by
        reason_note
        reason_updated_at
        created_at 
        return_obj_id
        sme_id
        store_id
        type_return
        updated_at
        import_images
        import_videos
        link_video
        returnWarehouseImportItems {
          returnOrderItem {
            order_id
            order_item_id
            id
            ref_variant_id
            sme_variant_id
            return_quantity
          }
          cancelOrderItem {
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
            sme_id
            store_id
            updated_at
            sme_product_id
            sme_variant_id
            warehouse_error_code
            warehouse_error_message
            is_combo
            comboItems {
              id
              connector_channel_code
              order_item_id
              order_item_transaction_id
              purchased_quantity
              sme_id
              sme_variant_id
              store_id
              warehouse_error_code
              warehouse_error_message
              warehouse_last_action
              warehouse_step
            } 
          }
          id
          sme_combo_variant_id
          return_quantity
          sme_variant_id
          import_quantity
        }
      }
    }

    scFailDeliveryOrderAggregate(search: $search) {
      count
    }

    sc_stores (context: $context) {
      connector_channel_code
      name
      id
      status
    }
    op_connector_channels {
      code
      id
      logo_asset_id
      logo_asset_url
      name
    }
  }
`;
