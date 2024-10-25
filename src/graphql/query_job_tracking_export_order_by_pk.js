import gql from 'graphql-tag';

export default gql`    
query job_tracking_export_order_by_pk($id: bigint!, $skip: Boolean = false) {
  job_tracking_export_order_by_pk(id: $id) @skip(if: $skip) {
    link_file_export
    status
  }
}

  
`;