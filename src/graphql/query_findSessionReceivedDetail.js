import gql from 'graphql-tag';

export default gql`
query findSessionReceivedDetail($id: Int!) {
  findSessionReceivedDetail(id: $id) {
    code
    count_imported
    count_package
    created_at
    created_by_obj
    id
    print_status
    received_at
    shipping_carrier
    sme_id
    sme_warehouse_id
    status
    updated_at
    receivedPackage {
      display_info {
        has_import_history
        keyword
        object_id
        object_ref_id
        object_tracking_number
        object_type
        package_id
        sf_received_code
        sf_received_id
        shipping_carrier
        store_id
      }
      has_import_history
      id
      input_search
      input_type
      object_id
      object_ref_id
      object_tracking_number
      object_type
      package_id
      sf_received_id
      store_id
    }
  }
}

  
`