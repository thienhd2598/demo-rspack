import gql from "graphql-tag";

export default gql`
query mktListCampaignTemplate($order_by: String = "", $order_by_type: String = "", $page: Int!, $per_page: Int!, $search: SearchCampaignTemplate = {}, $context: String) {
  mktListCampaignTemplate(page: $page, per_page: $per_page, search: $search, order_by: $order_by, order_by_type: $order_by_type) {
    connector_channel_code
    created_at    
    id
    name    
    sme_id
    object_type
    discount_type
    list_range_time {
      collect_time
      end_time
      start_time
    }
    status
    store_id            
    campaign_type
    min_time
    max_time
    product_count
    updated_at    
    item_type    
    total_campaign
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
    campaigns {
      connector_channel_code
      created_at 
      end_time     
      discount_type
      id
      name
      ref_id
      sme_id
      start_time
      status
      store_id
      code
      sync_status_info {
        message
        status
        status_color
        status_text
      }
      sync_error_message
      sync_status
      synced_at
      type
      updated_at
      source
      item_type
      object_type
      text_status
      product_count
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
    }
  }

  mktCampaignTemplateAggregate(search: $search) {
    count
  }
}
`