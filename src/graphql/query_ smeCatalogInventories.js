import gql from 'graphql-tag';

export default gql`
query sme_catalog_inventories($_eq: uuid = "") {
    sme_catalog_inventories(where: {variant_id: {_eq: $_eq}}) {
      product_id
      sme_id
      status
      stock_actual
      stock_available
      stock_reserve
      stock_allocated
      stock_shipping
      updated_at
      variant_id
    }
  }
`