import gql from "graphql-tag";

export default gql`
  mutation coMultipleImportWarehouse(
    $import_type: Int!
    $list_obj_import: [ImportOrderInput!]!
    $sme_warehouse_id: Int!
    $type_return: Int!
  ) {
    coMultipleImportWarehouse(import_type: $import_type, list_obj_import: $list_obj_import, type_return: $type_return, sme_warehouse_id: $sme_warehouse_id) {
      list_error {
        error_msg
        obj_tracking_number 
      }
        message
        success
        total
        total_error
        total_success
    }
  }
`;
