import gql from 'graphql-tag';

export default gql`
query sme_catalog_product_by_pk($id: uuid!) {
  sme_catalog_product_by_pk(id: $id) {
    id
    name
    sku
    sme_catalog_product_variants {
        id
        name   
        sku
        stock_on_hand
        price     
    } 
  }
}
`