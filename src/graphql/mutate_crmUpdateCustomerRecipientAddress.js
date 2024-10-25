import gql from 'graphql-tag';

export default gql`
    mutation crmUpdateCustomerRecipientAddress($id: Int!, $name: String, $address: String, $province_code: String, $district_code: String, $email: String, $phone: String, $ward_code: String) {
        crmUpdateCustomerRecipientAddress(
            name: $name, 
            id: $id,
            address: $address,            
            province_code: $province_code,
            district_code: $district_code,
            email: $email,
            phone: $phone,            
            ward_code: $ward_code,            
        ) {
            message
            success            
        }
    }
`