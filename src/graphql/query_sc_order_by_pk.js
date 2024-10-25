import gql from 'graphql-tag';

export default gql`    
    query sc_order_by_pk($id: bigint = "") {
        sc_order_by_pk(id: $id) {
            buyer_cancel_reason
            cancel_by
            connector_channel_code            
            created_at
            order_at
            currency_code
            customer {
                connector_channel_code
                created_at
                full_name
                id
                phone
                ref_id
                user_name
                updated_at
            }            
            customer_id
            id
            is_paid
            message_to_seller
            note
            order_items {                
                connector_channel_code
                created_at                
                id
                order_id
                original_price
                paid_price
                payload
                product_name
                quantity_purchased
                reason
                reason_detail
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
                updated_at
            }
            original_price
            paid_price
            payment_method
            platform_status
            promotion_platform_amount
            promotion_seller_amount
            buyer_transaction_fee
            seller_transaction_fee
            seller_discount_amount
            platform_discount
            shipping_fee_discount_from_3pl
            recipient_address {
                city
                connector_channel_code
                created_at
                customer_id
                district
                full_address
                full_name
                id
                payload
                phone
                
                region
                state
                town
                updated_at
                zip_code
            }
            logistic_packages {
                connector_channel_code
                created_at
                id
                logistics_status
                package_items {
                  created_at
                  id
                  order_id
                  package_id
                  ref_variant_id
                  ref_product_id
                  updated_at
                }
                order_id      
                tracking_number          
                package_number
                payload
                shipping_carrier
                sme_id
                store_id
            }
            updated_at
            update_time            
            store_id
            status
            sme_id
            shipping_original_fee
            shipping_discount_seller_fee
            shipping_discount_platform_fee            
            ref_store_id
            ref_number
            ref_id
            recipient_address_id
        }

        sc_order_aggregate {
            aggregate {
              count
            }
        }

        sc_stores {
            connector_channel_code
            name
            id
            status
          }
        op_connector_channels {
            code
            id
            logo_asset_id
            logo_asset_url
            name
        }
    }
`;