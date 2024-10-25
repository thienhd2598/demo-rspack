import gql from 'graphql-tag';

export default gql`
    query getListSettlementOrder($connector_channel_code: String,
     $page: Int!,
     $payment_system: String,
      $per_page: Int!,
      $is_old_order: Int,
      $range_time: [Int],
      $ref_order_id: String,
      $settlement_abnormal: Int,
      $settlement_abnormal_status:Int,
      $settlement_timeout: Int,
      $status: [String],
      $store_id: Int,
      $type_time: Int,
      ) {
        getListSettlementOrder(
            connector_channel_code: $connector_channel_code,
            page: $page,
            payment_system: $payment_system,
            per_page: $per_page,
            ref_order_id: $ref_order_id,
            range_time: $range_time,
            is_old_order: $is_old_order,
            settlement_abnormal: $settlement_abnormal,
            settlement_abnormal_status: $settlement_abnormal_status,
            settlement_timeout: $settlement_timeout,
            status: $status,
            store_id: $store_id,
            type_time: $type_time,
            ) {
            list_order {
                actual_shipping_fee
                affiliate_commission
                buyer_paid
                buyer_paid_shipping_fee
                completed_at
                connector_channel_code
                created_at
                id
                order_at
                order_id
                order_ref_id
                original_price
                other_fee
                other_fee_adjustment
                gift_amount
                commission_fee
                payment_fee
                payload
                payout_time
                platform_discount
                platform_shipping_rebate
                reverse_shipping_fee
                seller_coin_cash_back
                seller_discount
                seller_shipping_discount
                seller_return_refund
                seller_shipping_discount
                service_fee
                settlement_amount
                settlement_amount_adjustment
                settlement_amount_estimate
                shipping_fee_adjustment
                shipping_fee_discount_from_3pl
                status
                store_id
                total_after_discount
                settlement_type_selected
                settlement_note
                total_discount
                transaction_fee
                updated_at
                voucher_from_platform
                voucher_from_seller
            }
            summary_data {
                count_abnormal
                count_abnormal_pending
                count_abnormal_processed
                count_balance
                total_for_paging
                total_for_status
                total_settlement_values {
                    sum_actual_shipping_fee
                    sum_affiliate_commission
                    sum_buyer_paid
                    sum_buyer_paid_shipping_fee
                    sum_commission_fee
                    sum_final_settlement_amount
                    sum_gift_amount
                    sum_original_price
                    sum_other_fee
                    sum_other_fee_adjustment
                    sum_payment_fee
                    sum_platform_discount
                    sum_platform_shipping_rebate
                    sum_reverse_shipping_fee
                    sum_seller_coin_cash_back
                    sum_seller_discount
                    sum_seller_return_refund
                    sum_seller_shipping_discount
                    sum_service_fee
                    sum_settlement_amount
                    sum_settlement_amount_adjustment
                    sum_settlement_amount_estimate
                    sum_shipping_fee_adjustment
                    sum_shipping_fee_discount_from_3pl
                    sum_total_after_discount
                    sum_total_discount
                    sum_transaction_fee
                    sum_voucher_from_platform
                    sum_voucher_from_seller
                }
            }
        }
    }
`