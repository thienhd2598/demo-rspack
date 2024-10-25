import gql from 'graphql-tag';

export default gql`
query verify_public_verify_report_objects($search: SearchVerifyReportObjectInput = {}, $verify_report_id: Int!) {
  verify_public_verify_report_objects(search: $search, verify_report_id: $verify_report_id) {
    verify_objects {
      source_ref_id
      connector_channel_code
      created_at
      result
      id
      result_error_message
      sme_id
      sme_warehouse_id
      source
      source_ref_info
      store_id
      target_ref_id
      target_ref_info
      updated_at
      verify_date
      verify_object
      verify_report_id
    }
    total_failed
    total_passed
    total_process
    total
  }
}
`