import gql from "graphql-tag";

export default gql`
  mutation mktSaveCampaign(
    $is_sync: Int,
    $campaign_info: CampaignInfo , 
    $campaign_items: [CampaignItemDetail], 
    $support_data: CampaignSupportData, 
    $voucher_info: VoucherInfo,
    $add_on_deal_info_basic: AddOnDealInfoBasic,
    $campaign_sub_items: [CampaignSubItemInput]
  ) {
    mktSaveCampaign(
      campaign_info: $campaign_info, 
      campaign_items: $campaign_items, 
      is_sync: $is_sync, 
      support_data: $support_data, 
      voucher_info: $voucher_info,
      add_on_deal_info_basic: $add_on_deal_info_basic,
      campaign_sub_items: $campaign_sub_items,
    ) {
      message
      success
    }
}
`;