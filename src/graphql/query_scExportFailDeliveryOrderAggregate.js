import gql from 'graphql-tag';

export default gql`    
query scExportFailDeliveryOrderAggregate($list_status: [String] = [], $list_store: [ScStoreDataInput!] = [], $time_to: Int!, $time_from: Int!, $is_old_order: Int) {
    scExportFailDeliveryOrderAggregate(list_store: $list_store, time_from: $time_from, time_to: $time_to, list_status: $list_status, is_old_order: $is_old_order) {
        count
    }
  }
`;  