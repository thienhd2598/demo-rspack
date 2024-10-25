import gql from 'graphql-tag';

export default gql`
    mutation saveFinanceOrderSetting(
        $allow_order_status: [String],
        $is_create_order: Int!,
        $is_create_return: Int!,
        $order_code_type: String,
        $return_code_type: String,
        $return_when: [String],
    ) {
        saveFinanceOrderSetting(allow_order_status: $allow_order_status,
         is_create_order: $is_create_order,
         is_create_return: $is_create_return,
         order_code_type: $order_code_type,
         return_code_type: $return_code_type,
         return_when: $return_when,
         ) {
            message
            success
        }
    }
`;