import gql from "graphql-tag";

export default gql`
  query crmRatingByCustomer($first: Int!, $page: Int, $crm_customer_id: Int!) {
    crmRatingByCustomer(first: $first, page: $page, crm_customer_id: $crm_customer_id) {
        data {
            comment
            comment_images
            comment_videos
            reply
            reply_time
            created_at
            crm_customer_id
            id
            rating
            rating_time
            ref_comment_id
            sc_product_id
            sc_product_image
            sc_product_name
            sc_variant_id
            sc_variant_name
            sme_id
            store_id
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
