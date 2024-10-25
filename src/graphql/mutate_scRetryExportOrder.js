import gql from 'graphql-tag';

export default gql`    
mutation scRetryExportOrder($id: Int!) {
  scRetryExportOrder(id: $id) {
    job_tracking_export_order
    message
    success
  }
}

`;