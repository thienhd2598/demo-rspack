import gql from 'graphql-tag';

export default gql`
query sme_catalog_product($limit: Int = 10, $offset: Int = 0, $where: sme_catalog_product_bool_exp = {}, $order_by: [sme_catalog_product_order_by!] = {id: asc}) {
  sme_catalog_product(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
    id
    name
    sku    
    stock_on_hand
    price    
  }
}
`;
