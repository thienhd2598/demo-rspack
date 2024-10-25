import gql from 'graphql-tag';

export default gql`
    query sfListProductInSessionPickup($page: Int!, $per_page: Int!, $pickup_id: Int!) {
        sfListProductInSessionPickup(page: $page, per_page: $per_page, pickup_id: $pickup_id) {
            list_record {
                connector_channel_code
                created_at
                id
                picked_quantity
                sf_pickup_device_id
                sf_session_pickup_id
                sme_id
                sme_variant_id
                store_id
                total_quantity
                updated_at
            }
            total
        }
    }
`;
