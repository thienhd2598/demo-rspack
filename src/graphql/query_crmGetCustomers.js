import gql from "graphql-tag";

export default gql`
  query crmGetCustomers($page: Int!, $per_page: Int!, $search: SearchCustomer = {}) {
    crmGetCustomers(page: $page, per_page: $per_page, search: $search) {
        customers {
            address
            connector_channel_code
            count_order
            count_product            
            crmTag {
              created_at
              id
              sme_id
              title
              updated_at
            }
            crmStore {
              connector_channel_code
              crm_customer_id
              id
              store_id
            }
            district_code
            email
            id
            last_order_at
            name
            phone
            seller_username
            updated_at
            ref_customer_id
            sc_customer_id
            province_code
            total_paid
            sme_id
            total_rating            
        }
        total
    }
  }
`;
