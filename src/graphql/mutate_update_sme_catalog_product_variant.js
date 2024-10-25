import gql from 'graphql-tag';

export default gql`
mutation update_sme_catalog_product_variant($_in: [uuid!]!, $stock_warning: Int!) {
    update_sme_catalog_product_variant(where: {id: {_in: $_in}}, _set: {stock_warning: $stock_warning}) {
      affected_rows
    }
  }
  
`;