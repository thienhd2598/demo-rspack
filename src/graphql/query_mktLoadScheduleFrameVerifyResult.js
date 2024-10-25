import gql from "graphql-tag";

export default gql`
query mktLoadScheduleFrameVerifyResult(
    $campaign_id: Int,
    $error_type: Int,
    $page: Int,
    $per_page: Int
) {
  mktLoadScheduleFrameVerifyResult(campaign_id: $campaign_id, error_type: $error_type, page: $page, per_page: $per_page) {
    data {
        campaign_id
        connector_channel_code
        created_at
        error_msg
        error_type
        id
        mkt_campaign_schedule_frame_id
        sc_product_id
        sc_product_sku
        sme_product_id
        store_id
        updated_at
    }
    message
    success
    total
    total_miss
    total_miss_campaign
    total_miss_scheduled
    total_validate_fail
  }
}
`