import gql from 'graphql-tag';

export default gql`
mutation update_sme_catalog_notifications_by_pk($is_read: Int!, $id: Int!) {
    update_sme_catalog_notifications_by_pk(pk_columns: {id: $id}, _set: {is_read: $is_read}) {
      is_read
      id
    }
  }
`;