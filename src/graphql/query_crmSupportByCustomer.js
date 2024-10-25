import gql from "graphql-tag";

export default gql`
  query crmSupportByCustomer($first: Int!, $page: Int, $crm_customer_id: Int!) {
    crmSupportByCustomer(first: $first, page: $page, crm_customer_id: $crm_customer_id) {
        data {
            type
            sme_id
            id
            crm_customer_id
            content
            created_at
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
