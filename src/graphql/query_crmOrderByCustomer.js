import gql from "graphql-tag";

export default gql`
  query crmOrderByCustomer($first: Int!, $page: Int, $crm_customer_id: Int!) {
    crmOrderByCustomer(first: $first, page: $page, crm_customer_id: $crm_customer_id) {
        data {
            connector_channel_code
            count_variant
            created_at
            sc_order_id
            crm_customer_id
            id
            order_at
            product_image
            ref_id
            sme_id
            status
            store_id
            total_paid
            updated_at
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
