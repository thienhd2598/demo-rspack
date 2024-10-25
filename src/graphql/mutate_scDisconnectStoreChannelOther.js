import gql from 'graphql-tag';

export default gql`    
mutation scDisconnectStoreChannelOther($store_id: Int!) {
        scDisconnectStoreChannelOther(
        store_id: $store_id) {
        message
        success
    }
  }
`;