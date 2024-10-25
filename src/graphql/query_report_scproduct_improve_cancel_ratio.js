import gql from 'graphql-tag';

export default gql`
    query report_scproduct_improve_cancel_ratio($channel_codes: String, $date: Int!, $store_ids: String) {
        report_scproduct_improve_cancel_ratio(channel_codes: $channel_codes, date: $date, store_ids: $store_ids) {
            ratio
            scVariantId
            soldCount
            totalReturn
        }
    }
`;