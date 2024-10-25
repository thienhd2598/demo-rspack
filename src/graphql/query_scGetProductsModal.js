import gql from 'graphql-tag';

export default gql`
query ScGetSmeProducts($filter_out_ids: [Int], , $shipping_units: [String], $connector_channel_code: String = null, $page: Int = 1, $per_page: Int = 10, $q: String = "", $sc_category_id: Int = null, $status: Int = null, $store_id: Int = null, $sync_status: Int = null, $order_by: OrderBy = null, $stock: Int = null, $filter_ref_id: Int = null, $filter_map_sme: Int = null, $is_draft: Int = null, $tag_name: String = "", $has_origin_img: Int = null, $out_of_stock: Int) {
  ScGetSmeProducts(filter_out_ids: $filter_out_ids, shipping_units: $shipping_units,connector_channel_code: $connector_channel_code, page: $page, per_page: $per_page, q: $q, sc_category_id: $sc_category_id, status: $status, store_id: $store_id, sync_status: $sync_status, stock: $stock, filter_ref_id: $filter_ref_id, order_by: $order_by, filter_map_sme: $filter_map_sme, is_draft: $is_draft, tag_name: $tag_name, has_origin_img: $has_origin_img, out_of_stock: $out_of_stock) {
    total
    products {
      connector_channel_code
      created_at
      updated_at
      id
      name
      ref_id
      ref_logistic_channel_id
      sku      
      platform_status
      sum_sellable_stock
      platform_text_status            
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
      productVariants {
        id
        name
        sku
        ref_id
        price_minimum
        price
        sellable_stock
      }
      status
      store_id            
      scProductTag {
        id
        sme_id
        tag_name
      }      
    }
  }  
}


`;
