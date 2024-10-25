import gql from 'graphql-tag';

export default gql`
    query detailFinanceOrder($id: Int, $order_id: Int, $object_type: Int) {
        detailFinanceOrder(id: $id, order_id: $order_id, object_type: $object_type) {
            buyer_transaction_fee
            code
            completed_at
            connector_channel_code
            created_at
            object_type
            order_ref_id
            inc_vat_sum_amount
            order_id
            is_old_order
            financeOrderItem {
                quantity_purchased
                id
                cost_price
                inc_vat_original_price
                inc_vat_sum_original_price
                inc_vat_sum_discount
                inc_vat_sum_amount
                vat_rate
                sc_variant_id
                is_gift
                vat_amount
                sme_variant_id
                parent_sme_variant_id
                import_quantity
                finance_order_id
                sme_warehouse_id
                sc_object_item_id
            }
            id
            order_at
            invc_exported
            invoice {
                created_at 
                inv_transaction_id
                inv_ref_id
                inv_date
                status
                request_cancel_at
            }
            received_at
            store_id
            ref_id
            status
            payment_method
            sme_warehouse_id
            customer_username
            sc_object_id
            sum_discount
            sum_original_price
            vat_amount
            sum_paid_price
            sum_cost_price
            inc_vat_sum_discount
            inc_vat_sum_original_price
            wh_exported_at
            wh_imported_at
            wh_status
        }
    }
`