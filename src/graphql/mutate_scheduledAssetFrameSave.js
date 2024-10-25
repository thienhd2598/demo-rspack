import gql from "graphql-tag";

export default gql`
    mutation scheduledAssetFrameSave(
        $apply_from_time: String,
        $apply_to_time: String,
        $apply_type: Int!,
        $background_img: String,
        $frame_id: Int!,
        $id: Int,
        $list_product_add: [Int],
        $list_product_delete: [Int],
        $option: Int,
        $connector_channel_code: String,
        $store_id: Int,
        $title: String!,
    ) {
        scheduledAssetFrameSave(
            apply_from_time: $apply_from_time,
            apply_to_time: $apply_to_time,
            apply_type: $apply_type,
            background_img: $background_img,
            frame_id: $frame_id,
            id: $id,
            list_product_add: $list_product_add,
            list_product_delete: $list_product_delete,
            option: $option,
            connector_channel_code: $connector_channel_code,
            store_id: $store_id,
            title: $title,
        ) {
            data {
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
                title
                store_id
            }
            product_errors {
                id
                error_message
                scheduled_error {
                  apply_to_time
                  apply_from_time
                  id
                  title
                }
            }
            message
            success
        }
    }
`;
