import gql from 'graphql-tag';

export default gql`
    mutation crmCreateCustomer($name: String!, $address: String, $connector_channel_code: String, $province_code: String, $district_code: String, $email: String, $phone: String, $seller_username: String, $list_store_id: [Int], $ward_code: String) {
        crmCreateCustomer(
            name: $name, 
            address: $address,
            connector_channel_code: $connector_channel_code,
            province_code: $province_code,
            district_code: $district_code,
            email: $email,
            phone: $phone,
            seller_username: $seller_username,
            list_store_id: $list_store_id,
            ward_code: $ward_code,
        ) {
            message
            success            
        }
    }
`