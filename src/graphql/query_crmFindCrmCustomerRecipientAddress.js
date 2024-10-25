import gql from "graphql-tag";

export default gql`
  query crmFindCrmCustomerRecipientAddress($sc_recipient_address_id: Int) {
    crmFindCrmCustomerRecipientAddress(sc_recipient_address_id: $sc_recipient_address_id) {
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
    }
  }
`;
