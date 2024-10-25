import gql from "graphql-tag";

export default gql`
  query get_scheduled_asset_frame_detail($id: Int!) {
    get_scheduled_asset_frame_detail(id: $id) {
        apply_from_time
        apply_to_time
        apply_type
        connector_channel_code
        count_product_error
        count_product_success
        frame_id
        id
        option
        scheduledProducts {
            connector_channel_code
            error_msg
            id
            last_updated_at
            product_id
            scheduled_asset_frame_id
            sme_id
            status
            step
            store_id
        }
        sme_id
        status
        store_id
        title
    }
  }
`;
