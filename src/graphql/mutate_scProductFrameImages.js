import gql from 'graphql-tag';

export default gql`
    mutation scProductFrameImages($apply_type: Int!, $products: [Int!]!, $frame_url: String!, $option: Int! = null, $frame_shape: String = "", $frame_static: Int) {
        scProductFrameImages(apply_type: $apply_type, products: $products, frame_url: $frame_url, option: $option, frame_shape: $frame_shape, frame_static: $frame_static) {
            job_id
            message
            success            
        }
    }
`