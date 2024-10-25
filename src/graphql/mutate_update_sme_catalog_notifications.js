import gql from 'graphql-tag';

export default gql`
mutation update_sme_catalog_notifications {
    update_sme_catalog_notifications(where: {is_read: {_neq: 1}}, _set: {is_read: 1}) {
        affected_rows
    }
  }
`;