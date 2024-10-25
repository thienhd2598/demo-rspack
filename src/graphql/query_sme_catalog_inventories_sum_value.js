import gql from 'graphql-tag';

export default gql`
query inventorySumValuActual($type: String, $searchText: String, $status: String, $wareshouseId: Int, $product_status_id:Int,  $is_product_status: Int) {
  inventorySumValuActual(type: $type,searchText: $searchText, status: $status, , wareshouseId: $wareshouseId, product_status_id: $product_status_id, is_product_status: $is_product_status) {
    sum_price
    sum_stock
  }
}

`;
