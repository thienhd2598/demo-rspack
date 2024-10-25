import gql from 'graphql-tag';

export default gql`
query userGetProductStatusCount($type: String, $searchText: String, $wareshouseId: Int) {
  userGetProductStatusCount(type: $type, searchText: $searchText, wareshouseId: $wareshouseId) {
    product_status_id
    product_status_name
    total_product_variant
  }
}
`