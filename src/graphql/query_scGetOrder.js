import gql from "graphql-tag";

export default gql`
  query findOrderDetail($id: Int!, $context: String) {
    findOrderDetail(id: $id) {
      abnormal
      after_sale_type 
      buyer_cancel_reason
      cancel_by
      cancel_reason
      sme_note
      source
      change_detail
      shipment_param_need_load
      returnOrder {
        id
        buyer_videos
        images
        tracking_number
        return_reason_text
        connector_channel_code
        return_type
        store_id
        order_id
        ref_return_id
        returnWarehouseImport {
          import_images
          import_note
          import_videos
          link_video
          import_type
          returnWarehouseImportItems {
            import_quantity
            returnOrderItem {
              order_item_id
            }
            return_quantity
            sme_combo_variant_id
            sme_variant_id
          }
          reason_note
          sme_warehouse_id
          store_id
          type_return
        }
        refund_total
        returnOrderItems {
          id
          order_id
          sme_variant_id
          return_quantity
          order_item_id
          orderItem {
            id
            product_name
            comboItems {
              order_item_transaction_id
              purchased_quantity
              sme_variant_id
              order_item_id
            }
            quantity_purchased
            variant_sku
            variant_name
            variant_image
            sc_product_id
            is_combo
            sme_variant_id
          }
        }
        return_reason
      }
      logistic_fail
      paid_at
      person_in_charge
      ship_expired_at
      related_order_id
      payment_transaction_code
      connector_channel_code
      paid_shipping_fee
      shipping_fee_discount_from_3pl
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
      total_discount
      created_at
      order_at
      currency_code
      returnWarehouseImport {
        import_images
        import_videos
        link_video
        returnWarehouseImportItems {
          cancelOrderItem {
            id
          }
          returnOrderItem {
            order_item_id
          }
          import_quantity
          sme_combo_variant_id
          return_quantity
          sme_variant_id
        }
        import_note
        import_type
        reason_note
        sme_warehouse_id
        store_id
        type_return
      }
      tts_expired
      sync_error
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
      is_old_order
      is_paid
      message_to_seller
      note
      orderItems {
        order_item_transaction_id
        connector_channel_code
        created_at
        id
        show_link
        show_remove_gift
        show_unlink
        order_id
        original_price
        paid_price
        product_name
        discount_seller_amount
        is_gift
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
        package_id
        sme_id
        store_id
        updated_at
        sme_product_id
        sme_variant_id
        warehouse_error_message
        warehouse_error_code
        warehouse_step
        is_combo
        comboItems {
          id
          connector_channel_code
          order_item_id
          order_item_transaction_id
          purchased_quantity
          import_item {
            return_quantity
            import_quantity
          }
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
        district_code
        short_address
        state_code        
        region
        state
        town
        updated_at
        zip_code
        ward_code
        ward
      }
      logisticsPackages {
        id
        sc_warehouse_id
        show_add_gift
        show_cancel_outbound
        system_package_number
        pack_no
        logistic_provider_connected_id
        need_create_outbound
        sme_warehouse_id
        shipping_rule_check
        shipping_service
        shipping_type
        wms_hold
        order {
          status
        }
        order_id
        order {
          p_delivery_method
          shipping_original_fee
          tts_expired
        }
        package_number
        create_doc_status
        shipping_carrier
        print_status
        pack_status
        pack_abnormal
        warehouse_error_message
        warehouse_step
        s3_document
        connector_channel_error
        package_weight
        package_length
        package_width
        package_height
        tracking_number
        fulfillment_provider_type
        provider_or_id
        provider_or_error
        provider_or_status
        fulfillment_provider_connected_id
        shipping_carrier
        logisticsTrackingInfo{
          id
          tracking_update_time
          description
          package_id
          created_at
          updated_at
        }
      }
      updated_at
      update_time
      store_id
      status
      shipping_fee_by
      sme_id
      shipping_original_fee
      shipping_discount_seller_fee
      shipping_discount_platform_fee
      seller_discount_amount
      platform_discount
      ref_store_id
      ref_number
      ref_id
      recipient_address_id
      p_delivery_method
    }        

    sc_stores(context: $context) {
      connector_channel_code
      enable_multi_warehouse
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