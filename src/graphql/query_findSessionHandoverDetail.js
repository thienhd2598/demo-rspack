import gql from 'graphql-tag';

export default gql`
    query findSessionHandoverDetail($id: Int!) {
        findSessionHandoverDetail(id: $id) {
            code
            count_package
            count_package_valid
            created_at
            created_by_obj
            handoverPackages {
                id
                package_id
                sf_handover_id
                sme_id
                package {
                    id
                    tracking_number
                    order_id
                    system_package_number
                    total_purchased
                    package_number
                    shipping_carrier
                    print_status
                    count_variant
                    pack_status
                    store_id
                    pack_no
                    ref_order_id
                    order {
                    connector_channel_code
                    id
                    payment_method
                    store_id
                    fulfillment_provider_type
                    paid_price
                    source
                    logistic_fail
                    returnWarehouseImport {
                        id
                    }
                    status
                    sme_id
                    ref_store_id
                    ref_number
                    ref_id
                    }
                    orderItems {
                    comboItems {
                        order_item_transaction_id
                        purchased_quantity
                    }
                    order_item_transaction_id
                    connector_channel_code
                    id
                    order_id
                    is_combo
                    product_name
                    quantity_purchased
                    ref_order_id
                    ref_product_id
                    ref_variant_id
                    variant_name
                    variant_image
                    variant_sku
                    sc_product_id
                    sc_variant_id
                    sme_id
                    store_id
                    sme_product_id
                    sme_variant_id
                    is_combo
                    comboItems {
                        id
                        order_item_transaction_id
                        order_item_id
                        sme_variant_id
                        purchased_quantity
                    }
                    }
                }
            }
            handover_at
            id
            print_status
            shipping_carrier
            sme_id
            sme_warehouse_id
            status
            updated_at
        }
    }
`