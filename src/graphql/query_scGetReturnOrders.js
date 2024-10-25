import gql from "graphql-tag";

export default gql`
  query scGetReturnOrders(
    $page: Int!
    $per_page: Int!
    $search: SearchReturnOrder = {}
  ) {
    scGetReturnOrders(page: $page, per_page: $per_page, search: $search) {
      buyer_videos
      connector_channel_code
      id
      images
      order {
        customer {
          user_name
        }
        order_at
        fulfillment_provider_type
        ref_id
        ref_store_id
      }
      order_id
      shipping_tracking_number
      platform_status
      platform_status_text
      processed_warehouse
      ref_return_id
      refund_total
      returnOrderItems {
        connector_channel_code
        id
        item_price
        orderItem {
          connector_channel_code
          created_at
          discounted_price
          id
          order_id
          original_price
          package_id
          paid_price
          product_name
          quantity_purchased
          reason
          reason_detail
          ref_order_id
          ref_product_id
          ref_variant_id
          sc_product_id
          sc_variant_id
          sme_id
          sme_product_id
          sme_variant_id
          store_id
          updated_at
          order_item_transaction_id
          variant_image
          variant_name
          variant_sku
          warehouse_error_code
          warehouse_error_message
          warehouse_step
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
            warehouse_error_code
            warehouse_error_message
            warehouse_last_action
            warehouse_step
          }
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
      returnWarehouseImport {
        id
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
        sme_warehouse_id
        updated_at
        import_images
        link_video
        import_videos
        returnWarehouseImportItems {
          returnOrderItem {
            order_id
            order_item_id
            id
            ref_variant_id
            sme_variant_id
            return_quantity
          }
          id
          sme_combo_variant_id
          return_quantity
          sme_variant_id
          import_quantity
        }
      }
      return_reason
      return_reason_text
      reverse_request_time
      sme_id
      sme_reason_text
      sme_reason_type
      status
      store_id
      tracking_number
    }
  }
`;
