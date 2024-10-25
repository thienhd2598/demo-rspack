import gql from 'graphql-tag';

export default gql`    
mutation scRetryExportReturnOrder($id: Int!) {
  scRetryExportReturnOrder(id: $id) {
    job_tracking_export_order
    message
    success
  }
}

`;