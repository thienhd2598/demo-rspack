import gql from 'graphql-tag';

export default gql`
query sme_catalog_category($limit: Int, $offset: Int = 0) {
    sme_catalog_category(limit: $limit, offset: $offset, order_by: { updated_at: desc }) {
        created_at
        id
        name
        updated_at
    }
    sme_catalog_category_aggregate {
      aggregate {
        count
      }
    }
    
  }
`;