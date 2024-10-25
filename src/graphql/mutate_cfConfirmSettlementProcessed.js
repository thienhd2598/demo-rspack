import gql from 'graphql-tag';

export default gql`
    mutation cfConfirmSettlementProcessed(
        $list_id: [Int],
        $payout_time: Int
    ) {
        cfConfirmSettlementProcessed(list_id: $list_id, payout_time: $payout_time) {
            message
            success
            total_success
        }
    }
`;