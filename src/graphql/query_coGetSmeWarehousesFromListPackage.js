import gql from 'graphql-tag';

export default gql`    
query coGetSmeWarehousesFromListPackage($search: SearchPackage) {
    coGetSmeWarehousesFromListPackage(search: $search){
        data {
            number_package
            sme_warehouse_id
        }
  }
}`;