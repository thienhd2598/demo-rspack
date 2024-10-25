import gql from 'graphql-tag';

export default gql`
    query sfListPackageInSessionPickup($page: Int!, $per_page: Int!, $pickup_id: Int!, $search: SearchPackageInSession = {}) {
        sfListPackageInSessionPickup(page: $page, per_page: $per_page, pickup_id: $pickup_id, search: $search) {
            list_record {
                connector_channel_code
                created_at
                id                
                package_id
                sf_pickup_device_id
                sf_session_pickup_id
                print_status
                package {
                    count_variant
                    tracking_number
                    total_purchased
                    connector_channel_error
                    system_package_number
                    pack_status
                    print_status
                    order {
                        id
                        orderItems {
                            id
                        }
                        status
                        tts_expired
                        order_at
                    }
                }
                sme_id
                store_id
                updated_at
            }
            total
        }
    }
`;
