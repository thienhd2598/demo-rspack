import gql from "graphql-tag";

export default gql`
  query scGetJobStockTracking(
    $page: Int = 1
    $per_page: Int = 25
    $search: String = ""
    $store_id: Int = null
    $synced_status: Int = null
    $time_from: Int = null
    $time_to: Int = null
    $warehouse_id: Int  = null
  ) {
    scGetJobStockTracking(
      page: $page
      per_page: $per_page
      search: $search
      store_id: $store_id
      synced_status: $synced_status
      time_from: $time_from
      time_to: $time_to
      warehouse_id: $warehouse_id
    ) {
      total
      total_success
      total_fail
      job_stock {
        synced_error_msg
        id
        warehouse_id
        scProduct {
          id
          store_id
          connector_channel_code
          name
          productAssets {
            id
            ref_id
            ref_url
            sc_product_id
            sme_asset_id
            sme_url
            type
            position
            origin_image_url
            template_image_url
          }
          productVariantAttributes {
                id
                name
                sme_variant_attribute_id
                values
                ref_index
                sc_attribute_id
                position
          }
          variantAttributeValues {
            id
            sc_variant_attribute_id
            sme_variant_attribute_value_id
            value
            ref_index
            scVariantValueAssets {
              id
              ref_id
              ref_url
              sc_variant_attribute_value_id
              sme_asset_id
              sme_url
              type
            }
            position
          }
        }
        sc_product_variant {
          connector_channel_code
          id
          name
          price
          ref_id
          sku
          stock_allocated
          stock_on_hand
          sc_product_attributes_value
          sme_product_variant_id
          status
          merge_price
          merge_stock
        }
        stock
        synced_status
        sync_type
        synced_at
      }
    }
    sc_stores {
      connector_channel_code
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
`;
