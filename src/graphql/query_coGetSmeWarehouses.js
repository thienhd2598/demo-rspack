import gql from 'graphql-tag';

export default gql`    
query coGetSmeWarehouses($search: SearchOrder) {
    coGetSmeWarehouses(search: $search){
        data {
            number_package
            sme_warehouse_id
        }
  }
}`;