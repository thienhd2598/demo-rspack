import gql from 'graphql-tag';

export default gql`
query sme_catalog_product_variant($product_id: uuid!) {
  sme_catalog_product_variant(where: {product_id: {_eq: $product_id}}) {
    id
    name
    sku
    price
    stock_on_hand
    inventories {
      sme_store {
        id
        name
        is_default
      }
      sme_store_id
      stock_actual
      stock_allocated
      stock_available
      stock_reserve
      stock_preallocate
      stock_shipping
    }
    sc_product_variant {
      sku
      price
      stock_on_hand
      storeChannel {
        name
        id
        status
      }
      product {
        status
        ref_id
      }
    }
  }
}




`;
