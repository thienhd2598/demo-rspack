import gql from "graphql-tag";

export default gql`
  query crmReturnOrderByCustomer($first: Int!, $page: Int, $crm_customer_id: Int!) {
    crmReturnOrderByCustomer(first: $first, page: $page, crm_customer_id: $crm_customer_id) {
        data {
            count_variant
            created_at
            crm_customer_id
            sc_order_id
            id
            product_image
            return_at
            return_ref_id
            ref_order_id
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
