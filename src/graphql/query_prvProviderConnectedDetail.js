import gql from 'graphql-tag';

export default gql`
    query prvProviderConnectedDetail($id: Int!) {
        prvProviderConnectedDetail(id: $id) {
            category_code
            id
            last_connected_at
            last_disconnected_at
            provider_id
            link_webhook
            provider_name
            settings
            sync_provider_manual
            sync_provider_platform
            sync_package_pending
            sme_id
            status
            system_code
        }
    }
`