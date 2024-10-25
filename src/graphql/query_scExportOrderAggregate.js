import gql from 'graphql-tag';

export default gql`    
query scExportOrderAggregate($type: Int, $person_in_charge: String, $list_status: [String] = [],$list_shipping_unit: [String], $list_store: [ScStoreDataInput!] = [], $time_to: Int!, $time_from: Int!, $is_old_order: Int) {
    scExportOrderAggregate(type: $type, person_in_charge: $person_in_charge, list_store: $list_store,list_shipping_unit: $list_shipping_unit, time_from: $time_from, time_to: $time_to, list_status: $list_status, is_old_order: $is_old_order) {
        count
    }
  }
`;  