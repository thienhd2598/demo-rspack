import gql from 'graphql-tag';

export default gql`
    query report_smeproduct_improve_GMV($channel_codes: String, $date: Int!, $store_ids: String) {
        report_smeproduct_improve_GMV(channel_codes: $channel_codes, date: $date, store_ids: $store_ids) {
            increase            
            variantId
            totalPaid7
            totalPaid14
        }
    }
`;