import gql from 'graphql-tag';

export default gql`
query sc_sale_channel_brands($page: Int = 0, $per_page: Int = 20, $q: String = "", $connector_channel_code: String!, $sc_category_id: Int = null) {
  sc_sale_channel_brands(page: $page, per_page: $per_page, q: $q,  sc_category_id: $sc_category_id, connector_channel_code: $connector_channel_code) {
    id
    name
    connector_channel_code
    display_name
    ref_id
  }
}


`;
