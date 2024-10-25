import gql from "graphql-tag";

export default gql`
  query crmProductByCustomer($first: Int!, $page: Int, $crm_customer_id: Int!) {
    crmProductByCustomer(first: $first, page: $page, crm_customer_id: $crm_customer_id) {
        data {
            count_order
            count_purchased
            created_at
            id
            sme_id
            sme_product_id            
            sme_product_name
            sme_variant_id
            sme_variant_name
            last_order_at
            total_paid
            total_return_paid
            count_returned
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
