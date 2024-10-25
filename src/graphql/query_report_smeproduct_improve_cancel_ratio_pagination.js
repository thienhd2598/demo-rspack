import gql from 'graphql-tag';

export default gql`
    query report_smeproduct_improve_cancel_ratio_pagination($channel_codes: String, $date: Int!, $store_ids: String, $page: Int, $pageSize: Int) {
        report_smeproduct_improve_cancel_ratio_pagination(channel_codes: $channel_codes, date: $date, store_ids: $store_ids, page: $page, pageSize: $pageSize) {
            items {
                ratio
                variantId
                soldCount
                totalReturn
            }
            page
            pageSize
            totalPage            
        }
    }
`;