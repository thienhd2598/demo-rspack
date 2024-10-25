import gql from "graphql-tag";

export default gql`
query mktGetTrackingCampaignSyncing($search: SearchCampaign = {}) {
  mktGetTrackingCampaignSyncing(search: $search) {
    connector_channel_code
    created_at
    end_time
    id
    name
    discount_type
    ref_id
    sme_id
    start_time
    status
    text_status
    color_status
    store_id
    sync_error_message
    sync_status
    synced_at
    type
    updated_at
    object_type
    source
    item_type
    product_count    
  }
}
`