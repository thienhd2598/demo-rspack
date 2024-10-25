import gql from "graphql-tag";

export default gql`
query mktListCampaign($order_by: String = "", $order_by_type: String = "", $page: Int!, $per_page: Int!, $search: SearchCampaign = {}, $context: String) {
  mktListCampaign(page: $page, per_page: $per_page, search: $search, order_by: $order_by, order_by_type: $order_by_type) {
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
    sync_status_info {
      message
      status
      status_color
      status_text
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
  }

  mktCampaignAggregate(search: $search) {
    count
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
`