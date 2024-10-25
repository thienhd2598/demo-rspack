import gql from "graphql-tag";

export default gql`
  mutation mktSaveCampaignTemplate(
    $campaign_template_info: CampaignTemplateInfo , 
    $campaign_items: [CampaignItemDetail], 
    $support_data: CampaignSupportData, 
    $voucher_info: VoucherInfo,
    $add_on_deal_info_basic: AddOnDealInfoBasic,
    $campaign_sub_items: [CampaignSubItemInput]
  ) {
    mktSaveCampaignTemplate(
      campaign_template_info: $campaign_template_info, 
      campaign_items: $campaign_items, 
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