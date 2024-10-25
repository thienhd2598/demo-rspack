import gql from 'graphql-tag';

export default gql`
query ScGetSmeProducts($connector_channel_code: String = null, $page: Int = 1, $per_page: Int = 10, $q: String = "", $sc_category_id: Int = null, $status: Int = null, $store_id: Int = null, $sync_status: Int = null, $order_by: OrderBy = null, $stock: Int = null, $filter_ref_id: Int = null, $filter_map_sme: Int = null, $is_draft: Int = null, $tag_name: String = "", $has_origin_img: Int = null, $is_virtual: Int) {
  ScGetSmeProducts(connector_channel_code: $connector_channel_code, page: $page, per_page: $per_page, q: $q, sc_category_id: $sc_category_id, status: $status, store_id: $store_id, sync_status: $sync_status, stock: $stock, filter_ref_id: $filter_ref_id, order_by: $order_by, filter_map_sme: $filter_map_sme, is_draft: $is_draft, tag_name: $tag_name, has_origin_img: $has_origin_img, is_virtual: $is_virtual) {
    products {
        id
        productVariants {
            id
            variantInventoris {
                id
                inventory_change
                sc_variant_id
                sc_warehouse_id
                stock_on_hand
                store_id
            }
        }
    }
  }
}


`;
