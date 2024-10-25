import gql from "graphql-tag";

export default gql`
  query scGetOrder($search_type: String $q: String) {
    scGetOrder(search_type: $search_type q:$q) {
      buyer_cancel_reason
      cancel_by
      connector_channel_code        
      total_discount
      created_at
      order_at
      currency_code
      tts_expired
      sync_error      
      id
      is_paid
      message_to_seller
      note
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
      }
      original_price
      paid_price
      payment_method
      platform_status
      promotion_platform_amount
      promotion_seller_amount      
      logisticsPackages {
        id
        tracking_number
        order_id
        package_number
        shipping_carrier
        print_status
        pack_status        
      }
      updated_at
      update_time
      store_id
      status
      sme_id      
      ref_store_id
      ref_number
      ref_id
      recipient_address_id
      p_delivery_method
    }    
  }
`;
