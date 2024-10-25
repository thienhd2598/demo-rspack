import gql from 'graphql-tag';

export default gql`
mutation scSettingLinkProduct($merge_price: Int!, $merge_stock: Int!, $product_id: Int!) {
  scSettingLinkProduct(product_id: $product_id, merge_stock: $merge_stock, merge_price: $merge_price) {
    message
    success
  }
}
`;
