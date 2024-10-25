import gql from 'graphql-tag';

export default gql`
query scSumProductToAutoLink($connector_channel_code: String = null, $store_id: Int = null, $tags: [Int] = null, $product_type: Int!) {
  scSumProductToAutoLink(tags: $tags, store_id: $store_id, connector_channel_code: $connector_channel_code, product_type: $product_type) {
    total_product
  }
}


`;
