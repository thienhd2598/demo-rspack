import gql from 'graphql-tag';

export default gql`
    mutation approveManualOrder($list_order_id: [Int!]!) {
        approveManualOrder(list_order_id: $list_order_id) {
            list_fail {
                message
                order_ref_id
                order_id
            }
            message
            success
            total_fail
            total_success
        }
    }
`;