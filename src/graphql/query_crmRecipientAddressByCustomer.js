import gql from "graphql-tag";

export default gql`
  query crmRecipientAddressByCustomer($first: Int!, $page: Int, $crm_customer_id: Int!) {
    crmRecipientAddressByCustomer(first: $first, page: $page, crm_customer_id: $crm_customer_id) {
        data {
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
            sme_id
            ward_code
            wards_name
        }
        paginatorInfo {
            total
            perPage
            lastPage
            lastItem
            hasMorePages
            firstItem
            currentPage
            count
        }
    }
  }
`;
