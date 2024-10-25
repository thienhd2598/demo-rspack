import gql from 'graphql-tag';

export default gql`
    query report_scproduct_improve_cancel_ratio_pagination($channel_codes: String, $date: Int!, $store_ids: String, $page: Int, $pageSize: Int) {
        report_scproduct_improve_cancel_ratio_pagination(channel_codes: $channel_codes, date: $date, store_ids: $store_ids, page: $page, pageSize: $pageSize) {
            items {
                ratio
                scVariantId
                soldCount
                totalReturn
            }
            page
            pageSize
            totalPage
        }
    }
`;