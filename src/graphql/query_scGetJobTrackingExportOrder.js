import gql from "graphql-tag";

export default gql`
  query scGetJobTrackingExportOrder(
    $per_page: Int = 10
    $page: Int = 0
    $list_type: [Int],
    $list_person_in_charge: [String]
  ) {
    scGetJobTrackingExportOrder(
      per_page: $per_page
      page: $page
      list_type: $list_type
      list_person_in_charge: $list_person_in_charge
    ) {
      total
      job_tracking_export_orders {
        created_at
        file_name
        params_payload
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
