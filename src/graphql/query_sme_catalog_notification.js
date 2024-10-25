import gql from 'graphql-tag';

export default gql`
query sme_catalog_notifications {
    sme_catalog_notifications(order_by: {created_at: desc}) {
      created_at
      icon_link
      id
      is_read
      ref_id
      ref_type
      message
      sme_id
      title
      type
      updated_at
    }
  }
`