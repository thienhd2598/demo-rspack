import gql from 'graphql-tag';

export default gql`
query getInvoiceSetting {
    getInvoiceSetting{
       date_type
        from_date
        id
        provider_connected_id
        is_auto
        order_status        
  }
}


`;
