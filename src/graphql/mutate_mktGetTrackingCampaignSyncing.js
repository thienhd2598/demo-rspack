import gql from "graphql-tag";

export default gql`
query mktGetTrackingCampaignSyncing($order_by: String = "", $order_by_type: String = "", $page: Int!, $per_page: Int!, $search: SearchCampaignTemplate = {}, $context: String) {
  mktGetTrackingCampaignSyncing(page: $page, per_page: $per_page, search: $search, order_by: $order_by, order_by_type: $order_by_type) {
    connector_channel_code
    created_at    
    id
    name    
    sme_id
    list_range_time    
    status
    store_id            
    campaign_type
    min_time
    max_time
    product_count
    updated_at    
    item_type    
    total_campaign
    campaigns {
      connector_channel_code
      created_at 
      end_time     
      id
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
    }
  }
}
`