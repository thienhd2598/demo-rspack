import gql from "graphql-tag";

export default gql`
  mutation coImportDataManualOrder($file_url: String!, $person_in_charge: String) {
    coImportDataManualOrder(file_url: $file_url, person_in_charge: $person_in_charge) {
        list_error {
            error_msg
            ref_order_id
        }
        message
        success
        total
        total_error
        total_success
    }
  }
`;
