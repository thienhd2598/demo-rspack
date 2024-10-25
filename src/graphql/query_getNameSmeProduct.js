import gql from 'graphql-tag';

export default gql`
query ScGetSmeProducts($q: String = null, $is_draft: Int = null) {
  ScGetSmeProducts(q: $q, is_draft: $is_draft) {
    total
    products {
      id
      name
    }
  }
}


`;
