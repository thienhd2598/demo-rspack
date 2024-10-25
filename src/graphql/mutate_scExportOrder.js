import gql from 'graphql-tag';

export default gql`    
mutation scExportOrder($template_type: String,$person_in_charge: String, $list_status: [String] = [],$list_shipping_unit: [String], $list_store: [ScStoreDataInput!] = [], $time_to: Int!, $time_from: Int!, $is_old_order: Int,$type: Int) {
    scExportOrder(template_type: $template_type, person_in_charge: $person_in_charge, list_shipping_unit: $list_shipping_unit, list_store: $list_store, time_from: $time_from, time_to: $time_to, list_status: $list_status, is_old_order: $is_old_order, type: $type) {
      message
      success
    }
  }
`;