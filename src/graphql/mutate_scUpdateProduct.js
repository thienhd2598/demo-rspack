import gql from 'graphql-tag';

export default gql`
mutation scUpdateProduct($sc_product_data: ScUpdateProductInput!, $sync_status: Int = 0) {
  scUpdateProduct(sc_product_data: $sc_product_data, sync_status: $sync_status) {
    product_id
    success
    message

  }
}


`;
