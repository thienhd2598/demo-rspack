import gql from "graphql-tag";

export default gql`
  mutation cfImportDataSettlement(
    $file_url: String!
  ) {
    cfImportDataSettlement(
        file_url: $file_url
    ) {
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