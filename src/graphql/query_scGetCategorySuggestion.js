import gql from 'graphql-tag';

export default gql`
query scGetCategorySuggestion($product_name: String!, $store_id: Int!, $skip: Boolean = false) {
  scGetCategorySuggestion(product_name: $product_name, store_id: $store_id) @skip(if: $skip) {
    category_name
    category_path
    ref_category_id
    sc_category_id
  }
}


`;
