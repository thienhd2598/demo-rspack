import gql from 'graphql-tag';

export default gql`
query scGetJobAutoLinkSmeProduct($product_type: Int!) {
  scGetJobAutoLinkSmeProduct(product_type: $product_type) {
    total_product
    total_processed
    total_not_link
    total_linked
  }
}


`;
