import gql from 'graphql-tag';

export default gql`
    mutation scActionMultipleProduct($frame_options: ActionFrameInput, $products: [Int!]!, $prefix_name: String, $check_prefix: Int!, $check_frame: Int!, $action_type: String!) {
        scActionMultipleProduct(frame_options: $frame_options, products: $products, prefix_name: $prefix_name, check_prefix: $check_prefix, check_frame: $check_frame, action_type: $action_type) {
            job_id
            message
            success 
            total_prefix_fail
            total_prefix_success
        }
    }
`