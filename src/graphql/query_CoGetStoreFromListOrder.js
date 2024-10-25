import gql from 'graphql-tag';

export default gql`    
query CoGetStoreFromListOrder($search: SearchOrder) {
    CoGetStoreFromListOrder(search: $search){
        data {
          connector_channel_code
          id
          number_order
          name
        }
  }
}`;