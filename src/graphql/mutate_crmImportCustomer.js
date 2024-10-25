import gql from "graphql-tag";

export default gql`
  mutation crmImportCustomer(    
    $file_url: String!
  ) {
    crmImportCustomer(file_url: $file_url) {
        list_error {
            connector_channel_code
            error_msg
            seller_username
        }
        message
        success
        total
        total_error
        total_success
    }
  }
`;
