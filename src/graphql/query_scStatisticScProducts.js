import gql from 'graphql-tag';

export default gql`
  query scStatisticScProducts($filter_ref_id: Int = null, $q: String = "", $prefix_name: String, $is_draft: Int = null, $sc_category_id: Int = null, $store_id: Int = null, $tag_name: String = "", $filter_map_sme: Int = null, $has_origin_img: Int = null) {
    scStatisticScProducts(filter_ref_id: $filter_ref_id, q: $q, prefix_name: $prefix_name, store_id: $store_id, is_draft: $is_draft, sc_category_id: $sc_category_id, tag_name: $tag_name, filter_map_sme: $filter_map_sme, has_origin_img: $has_origin_img) {
      total_product
      connector_channel_code
      group {
        active
        inactive
        incoming_out_stock
        out_stock
        total_not_syncup
        not_map_sme
        banned
        virtual
      }
    }
  }
`;
