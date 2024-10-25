import gql from 'graphql-tag';
export default gql`
    query getListFinanceOrder(
    $connector_channel_code: [String],
    $abnormal: Int,
    $store_id: [Int]
     $cost_price: Int,
     $order_status: String,
     $invoice_exported: Int,
     $invoice_cancel: Int,
      $from_date: String,
      $keyword: String,
      $is_old_order: Int,
      $list_source: [String],
      $keyword_type: Int,
      $object_type:Int,
      $page: Int!,
      $payment_method: String,
      $is_lower_cost_price: Int,
      $per_page: Int!,
      $to_date: String,
      $time_type: String,
      $warehouse_status: Int,
      ) {
        getListFinanceOrder(
            abnormal: $abnormal,
            connector_channel_code: $connector_channel_code,
            cost_price: $cost_price,
            order_status: $order_status,
            invoice_exported: $invoice_exported,
            invoice_cancel: $invoice_cancel,
            store_id: $store_id,
            from_date: $from_date,
            is_old_order: $is_old_order,
            keyword: $keyword,
            list_source: $list_source,
            keyword_type: $keyword_type,
            object_type: $object_type,
            payment_method: $payment_method,
            is_lower_cost_price: $is_lower_cost_price,
            per_page: $per_page,
            time_type: $time_type,
            to_date: $to_date,
            warehouse_status: $warehouse_status,
            page: $page,
            ) {
            list_order {
                buyer_transaction_fee
                code
                completed_at
                customer_username
                connector_channel_code
                created_at
                currency_code
                financeOrderItem {
                    parent_sme_variant_id
                    id
                    quantity_purchased
                    sc_variant_id
                    is_gift
                    sme_variant_id
                }
                id
                invc_exported 
                inv_request_cancel
                invoice {
                    created_at 
                    inv_transaction_id
                    doc_url
                    finance_order_id
                    id
                    inv_code
                    inv_date
                    inv_error
                    inv_no
                    inv_ref_id
                    inv_ref_status
                    inv_transaction_id
                    status
                }
                object_type
                order_at
                original_price
                other_fee
                paid_price
                paid_shipping_fee
                payment_method
                platform_commission_fee
                platform_discount
                platform_service_fee
                ref_id
                ref_number
                ref_store_id
                reverse_request_time
                sc_object_id
                seller_coin_cash_back
                seller_discount_amount
                seller_revenue
                seller_transaction_fee
                shipping_discount_platform_fee
                shipping_discount_seller_fee
                shipping_fee_discount_from_3pl
                shipping_original_fee
                status
                store_id
                sum_cost_price
                sum_discount
                sum_original_price
                sum_paid_price
                total_discount
                updated_at
                voucher_platform_amount
                voucher_seller_amount
                wh_exported_at
                wh_imported_at
                wh_status
            }
            summary_data {
                total_for_paging
                total_invoice_exported
                count_sell_lower_cost_price
                total_invoice_not_exported
                count_invoice_cancel
                count_invoice_no_cancel
                total_paid_price
            }
        }
    }
`