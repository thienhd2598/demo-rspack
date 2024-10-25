import gql from "graphql-tag";

export default gql`
  query getListScheduledFrame($page: Int!, $per_page: Int!, $store_id: [Int], $search_text: String, $status: Int) {
    getListScheduledFrame(page: $page, per_page: $per_page, store_id: $store_id, search_text: $search_text, status: $status) {
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
        created_at
        sme_id
        status
        store_id
        title
    }
  }
`;
