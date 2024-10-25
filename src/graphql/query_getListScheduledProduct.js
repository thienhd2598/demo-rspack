import gql from "graphql-tag";

export default gql`
  query getListScheduledProduct($page: Int!, $per_page: Int!, $scheduled_asset_frame_id: Int, state: String) {
    getListScheduledProduct(page: $page, per_page: $per_page, scheduled_asset_frame_id: $scheduled_asset_frame_id, state: $state) {
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
  }
`;
