import gql from 'graphql-tag';

export default gql`
mutation update_sme_catalog_product_variant_price($_in: [uuid!]!, $price: Int!, $price_minimum: Int!) {
    update_sme_catalog_product_variant(where: {id: {_in: $_in}}, _set: {price: $price, price_minimum: $price_minimum}) {
      affected_rows
    }
  }
  
`;