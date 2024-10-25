import gql from 'graphql-tag';

export default gql`
mutation scProductSyncDown($products: [ProductEdit] = {}, $store_id: Int!, $is_lot: Int, $outbound_method: String, $is_expired_date: Int) {
  scProductSyncDown(store_id: $store_id, products: $products, is_expired_date: $is_expired_date, is_lot: $is_lot, outbound_method: $outbound_method) {
    list_product_fail {
      error_message
      sku
    }
    message
    success
    sync_product_job_id
    total_fail
    total_product
    total_success
  }
}

`;
