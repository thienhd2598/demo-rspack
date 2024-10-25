import gql from 'graphql-tag';

export default gql`
    query listScheduledAssetViaFrame($frame_id: Int!) {
        listScheduledAssetViaFrame(frame_id: $frame_id) {
            apply_from_time
            apply_to_time
            apply_type
            connector_channel_code
            count_product_error
            count_product_success
            created_at
            frame_id
            id
            option
            scheduledProducts {
                connector_channel_code
                created_at
                error_msg
                id
                last_updated_at
                product_id
                scheduled_asset_frame_id
                sme_id
                status
                step
                store_id
                updated_at
            }
            sme_id
            status
            store_id
            title
            updated_at
        }
    }
`