import gql from 'graphql-tag';

export default gql`
query listOrderCheckingQuantity {
    listOrderCheckingQuantity {
        check_time
        connector_channel_code
        created_at
        id
        local_quantity
        seller_quantity
        store_id
        updated_at
  }
}

`;
