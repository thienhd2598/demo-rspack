import gql from 'graphql-tag';

export default gql`
query sme_catalog_notifications_aggregate {
    sme_catalog_notifications_aggregate(where: {is_read: {_neq: 1}}) {
      aggregate {
        count
      }
    }
  }
`;