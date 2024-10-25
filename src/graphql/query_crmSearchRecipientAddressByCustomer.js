import gql from "graphql-tag";

export default gql`
  query crmSearchRecipientAddressByCustomer($per_page: Int!, $page: Int!, $search: SearchAddress = {}) {
    crmSearchRecipientAddressByCustomer(per_page: $per_page, page: $page, search: $search) {
        customer_address {
            address
            connector_channel_code
            created_at
            crm_customer_id
            sc_recipient_address_id
            district_code
            email
            id
            name
            phone
            updated_at
            province_code
            ward_code
            wards_name
            sme_id
        }
        total
    }
  }
`;
