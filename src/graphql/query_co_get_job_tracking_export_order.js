import gql from 'graphql-tag';

export default gql`    
query co_get_job_tracking_export_order($id: Int!) {
  co_get_job_tracking_export_order(id: $id){
    link_file_export
    status
  }
}

  
`;