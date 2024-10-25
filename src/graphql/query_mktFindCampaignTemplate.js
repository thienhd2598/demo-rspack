import gql from "graphql-tag";

export default gql`
query mktFindCampaignTemplate($id: Int!) {
  mktFindCampaignTemplate(id: $id) {
    campaignScheduleFrame {
        apply_before_second
        apply_type
        campaign_id
        connector_channel_code
        created_at
        error_msg
        frame_id
        id
        last_verified_at
        option
        schedule_frame_id
        store_id
        updated_at
        verified_result
    }
    campaignAddOnDeal {
      campaign_id
      campaign_template_id
      connector_channel_code
      created_at
      gift_num
      id
      purchase_limit
      purchase_min_spend
      sme_id
      store_id
      updated_at
    }
    campaignSubItem {
      campaign_id
      campaign_template_id
      connector_channel_code
      created_at
      discount_percent
      id
      is_enable
      last_action
      promotion_price
      purchase_limit
      ref_product_id
      ref_variant_id
      sc_product_id
      sc_variant_id
      sc_variant_sku
      sme_id
      sme_variant_id
      sme_variant_sku
      store_id
      updated_at
      sync_status
      sync_error_message
    }
    campaigns {
        connector_channel_code
        created_at
        end_time        
        id
        code
        name
        ref_id
        sme_id
        start_time
        status
        store_id
        sync_error_message
        sync_status
        synced_at
        type
        updated_at
        source
        item_type
        product_count
        sync_status_info {
          message
          status
          status_color
          status_text
        }
    }
    campaignVoucher {
      campaign_template_id
      collect_time
      created_at
      discount_amount
      display_channel_list
      error_message
      error_type
      id
      limit_per_user
      max_discount_price
      min_order_price
      updated_at
      usage_quantity
      used_quantity
    }
    campaign_type
    connector_channel_code
    created_at
    discount_type
    id
    code
    item_type
    list_range_time {
      collect_time
      end_time
      start_time
    }
    max_time
    min_time
    name
    on_create_reserve_ticket
    on_create_schedule_frame
    sme_id
    status
    store_id
    total_campaign
    updated_at
    campaignItems {
      campaign {
        discount_type
      }
      mktItemDiscount {
        campaign_id
        connector_channel_code
        created_at
        discount_percent
        id
        mkt_item_id
        promotion_price
        promotion_stock
        purchase_limit
        ref_promotion_price
        ref_promotion_stock
        sme_id
        store_id
        updated_at
      }
      mktItemFlashSale {
        campaign_id
        connector_channel_code
        created_at
        discount_percent
        id
        mkt_item_id
        promotion_price
        promotion_stock
        purchase_limit
        ref_promotion_price
        ref_promotion_stock
        sme_id
        store_id
        updated_at
      }
      is_enable
      ref_product_id
      ref_variant_id
      campaign_id
      connector_channel_code
      created_at
      id
      sc_product_id
      sc_variant_id
      sc_variant_sku
      sme_id
      sme_variant_id
      sme_variant_sku
      sync_status
      sync_error_message
    }
  }

  op_connector_channels {
    code
    id
    logo_asset_id
    logo_asset_url
    name
  }
}
`