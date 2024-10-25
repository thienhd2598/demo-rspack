import gql from 'graphql-tag';

export default gql`
    query report_scproduct_improve_GMV($channel_codes: String, $date: Int!, $store_ids: String) {
        report_scproduct_improve_GMV(channel_codes: $channel_codes, date: $date, store_ids: $store_ids) {
            increase            
            scVariantId
            totalPaid7
            totalPaid14
        }
    }
`;