import gql from "graphql-tag";

export default gql `
query mktGetCampaignByVariant($list_sc_variant_id: [Int]) {
  mktGetCampaignByVariant(list_sc_variant_id: $list_sc_variant_id) {
    connector_channel_code
    created_at
    discount_type
    end_time
    id
    name
    start_time
    status
    store_id
    type
    campaignItem {
      id
      mktItemDiscount {
        discount_percent
        id
        mkt_item_id
        promotion_price
        promotion_stock
        purchase_limit
      }
      mktItemFlashSale {
        discount_percent
        id
        mkt_item_id
        promotion_price
        promotion_stock
        purchase_limit
      }
      sc_variant_id
      sc_product_id
    }
  }
}
`