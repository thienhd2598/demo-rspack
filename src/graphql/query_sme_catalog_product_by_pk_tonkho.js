import gql from 'graphql-tag';

export default gql`
query query_sme_catalog_product_by_pk_tonkho($id: uuid!, $skip: Boolean = false) {
  sme_catalog_product_by_pk(id: $id) @skip(if: $skip) {
    name
    sku
    price
    stock_on_hand
    scProduct {
      connector_channel_code
      store_id
      price
      sku
      stock_on_hand
    }
    sme_catalog_product_variants {
      id
      name
      sku
      stock_on_hand
      sc_product_variant {
        name
        price
        sku
        stock_on_hand
        storeChannel {
          connector_channel_code
          name
          id
        }
      }
    }
  }
}





`;
