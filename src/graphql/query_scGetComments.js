import gql from 'graphql-tag';

export default gql`
query scGetComments(
    $order_by: String,
    $order_by_type: String,
    $page: Int!,
    $per_page: Int!,
    $search: SearchComment
) {
    scGetComments(order_by: $order_by,
    order_by_type: $order_by_type,
    page: $page,
    per_page: $per_page,
    search: $search) {
       
        buyer_username
        comment
        create_time
        created_at
        edittable
        id
        can_reply
        order_id
        rating_star
        ref_comment_id
        ref_order_id
        review_images 
        review_videos
        replyRating {
            autoRatingComment {
                comment
                created_at
                id
                rating_filter_id
                updated_at
            }
            create_time
            created_at
            edittable
            hidden
            id
            is_sync
            rating_id
            reply
            user_name
            reply_sample_id
            store_id
            updated_at
        }
        store_id
        updated_at
        product {
            name
            sku
            id
            productAssets {
                template_image_url
                type
                ref_url
                position
                sme_url
            }
        }
        productVariant {
            name
        }
    }    
    scCommentAggregate(
        search: $search
    ) {
        count
    }
    
}
`;
