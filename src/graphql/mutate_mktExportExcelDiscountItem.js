import gql from "graphql-tag";

export default gql`
    mutation mktExportExcelDiscountItem($item_type: Int!, $list_item_id: [Int], $store_id: Int!) {
        mktExportExcelDiscountItem(item_type: $item_type, list_item_id: $list_item_id, store_id: $store_id) {
            message
            success
            url
        }
    }
`;