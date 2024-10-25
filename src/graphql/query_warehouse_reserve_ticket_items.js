import gql from 'graphql-tag';

export default gql`
query warehouse_reserve_ticket_items($limit: Int = 10, $offset: Int = 0, $where: warehouse_reserve_ticket_items_bool_exp = {}, $order_by: [warehouse_reserve_ticket_items_order_by!] = { updated_at: desc }) {
    warehouse_reserve_ticket_items(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
        created_at
        error_message
        id
        sc_variant_id
        is_combo
        product_id
        quantity
        sme_id
        status
        updated_at
        variant_id
        warehouse_id
        warehouse {
            id
            name
            total_variants
        }
        warehouse_reserve_ticket {
            created_at
            end_date
            id
            name
            sc_store_id
            sme_id
            status
            start_date
            updated_at
            total_variant
            total_error
        }
        warehouse_reserve_ticket_id
        variant {
            id
            name
            sku
            in_any_checklist_not_complete
            is_combo
            inventories {
                sme_store_id
                stock_actual
                stock_available
                stock_reserve
                stock_allocated
                stock_preallocate
                stock_shipping
            }
            sc_variant_linked {
                id
                sc_variant_id
                sme_variant_id
                store_id
                created_at
            }

            sc_product_variant {
                id
                name
                sku
                product {
                    productAssets {
                            origin_image_url
                    }
                }
            }
            combo_items {
                quantity        
                variant_id
                combo_item {
                product_id
                id
                name
                sku
                unit
                product_id
                inventories {
                    sme_store_id
                    stock_actual
                    stock_available
                    stock_reserve
                    stock_allocated
                    stock_preallocate
                    stock_shipping
                }
                inventory {
                    stock_actual
                    stock_allocated
                    stock_shipping
                    stock_available
                    stock_reserve
                }
                sme_catalog_product_variant_assets {
                    asset_id
                    asset_url
                    id
                }
                attributes {
                    id
                    sme_catalog_product_attribute_value {
                    name
                    position
                    sme_catalog_product_custom_attribute {
                        display_name
                        name
                    }
                    assets {
                        position_show
                        id
                        asset_url
                    }
                    }
                }
                sme_catalog_product {
                    id
                    name
                }
                }
            }
            sme_catalog_product {
                id
                name
                is_combo
            }
            inventory {
                status
                stock_actual
                stock_available
                stock_reserve
                stock_allocated
                variant {
                    cost_price
                    price
                    }
            }
            attributes {
                sme_catalog_product_attribute_value {
                name
                position
                sme_catalog_product_custom_attribute {
                    display_name
                    name
                }
                assets {
                    position_show
                    id
                    asset_url
                }
                }
            }
            updated_at

            sme_catalog_product_variant_assets {
                asset_url
            }
           unit
        }
    }
    warehouse_reserve_ticket_items_aggregate(where: $where) {
      aggregate {
        count
      }
    }
}
`;
