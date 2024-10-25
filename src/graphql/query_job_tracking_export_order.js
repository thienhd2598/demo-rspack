import gql from 'graphql-tag';

export default gql`    
query job_tracking_export_order($limit: Int = 10, $offset: Int = 0, $where: job_tracking_export_order_bool_exp = {}) {
    job_tracking_export_order(limit: $limit, offset: $offset, order_by: {created_at: desc}, where: $where) {
      created_at
      file_name
      id
      link_file_export
      sme_id
      status
      time_form
      time_to
      total_order
      updated_at
      list_status
      list_store
    }
    job_tracking_export_order_aggregate( where: $where) {
      aggregate {
        count
      }
    }
    op_connector_channels {
      code
      id
      logo_asset_id
      logo_asset_url
      name
    }
  }
  
`;