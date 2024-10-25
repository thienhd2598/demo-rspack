import gql from 'graphql-tag';

export default gql`
    query prvListProvider($connected: Int, $code: String, $list_category: [Int],$list_category_code: [String], $list_status: [Int], $name: String){
        prvListProvider(
            connected: $connected
            code: $code
            list_category: $list_category
            list_category_code: $list_category_code
            list_status: $list_status
            name: $name
        ) {
            data {
                auth_type
                category {
                    description
                    id
                    name
                }
                code
                description
                email
                id
                logistic_services {
                    code
                    label
                }
                logo
                name
                system_code
                providerConnected {
                    id
                    last_connected_at
                    last_disconnected_at
                    provider_id
                    provider_name
                    system_code
                    link_webhook
                    status
                }
                website
            }
            message
            total
        }
    }
`