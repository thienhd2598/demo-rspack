import gql from 'graphql-tag';

export default gql`
    query prvListProviderConnected($category_code: String) {
        prvListProviderConnected(category_code: $category_code) {
            data {
                category_code
                id
                last_connected_at
                last_disconnected_at
                provider_id
                provider_name
                settings                
                status
                system_code
            }
            message
            total
        }
    }
`