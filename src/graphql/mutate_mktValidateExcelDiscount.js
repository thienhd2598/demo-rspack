import gql from "graphql-tag";

export default gql`
  mutation mktValidateExcelDiscount($file_url: String!, $item_type: Int!, $store_id: Int!) {
    mktValidateExcelDiscount(file_url: $file_url, item_type: $item_type, store_id: $store_id) {
        total_success
        total_error
        total
        success
        message
        list_pass {
            list_sc_variant_id
            sc_product_id
            sc_variant_id
            promotion_stock
            promotional_price
            purchase_limit
            sku
        }
        list_error {
            message
            sku
        }
    }
  }
`;