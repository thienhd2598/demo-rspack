import gql from 'graphql-tag';

export default gql`
    query sc_composite_image_sync($id: Int!) {
        sc_composite_image_sync(id: $id) {
            total_fail
            total_product
            total_success
            sync_at
        }
    }
`;