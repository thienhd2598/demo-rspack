import gql from 'graphql-tag';

export default gql`    
query coGetStoreFromListPackage($search: SearchPackage) {
    coGetStoreFromListPackage(search: $search){
        data {
          connector_channel_code
          id
          number_package
          name
        }
  }
}`;