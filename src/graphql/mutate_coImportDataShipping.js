import gql from "graphql-tag";

export default gql`    
    mutation coImportDataShipping($file_url: String!) {
        coImportDataShipping(file_url: $file_url) {
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