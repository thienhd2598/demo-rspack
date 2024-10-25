import gql from 'graphql-tag';

export default gql`
query verify_public_verify_reports($search: SearchVerifyReportInput) {
  verify_public_verify_reports(search: $search) {
    total
    verify_reports {
      connector_channel_code
      created_at
      id
      sme_warehouse_id
      sme_id
      source
      source_info
      store_id
      target_info
      total_failed
      total_passed
      total_source
      total_target
      updated_at
      verify_date
      verify_object
    }
  }
}
`