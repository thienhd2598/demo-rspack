import gql from "graphql-tag";

export default gql`
  mutation crmRetryExportCustomer($id: Int!) {
    crmRetryExportCustomer(id: $id) {        
        message
        success
    }
  }
`;
