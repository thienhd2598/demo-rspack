import gql from 'graphql-tag';

export default gql`
    query scGetProductVariants($connector_channel_code: String = null, $page: Int = 1,$product_status: Int, $status: Int, $per_page: Int = 10, $q: String = "", $store_id: Int = null, $order_by: OrderBy = null, $filter_map_sme: Int = null, $is_virtual: Int,$variant_ids: [Int], $out_of_stock: Int) {
        scGetProductVariants(connector_channel_code: $connector_channel_code, product_status: $product_status, status: $status, page: $page, per_page: $per_page, q: $q, store_id: $store_id, order_by: $order_by, filter_map_sme: $filter_map_sme, variant_ids: $variant_ids, is_virtual: $is_virtual, out_of_stock: $out_of_stock) {
            total
            variants {
                id
                name
                sku
                created_at
                sc_product_attributes_value
                sme_product_variant_id     
                price
                sellable_stock
                stock_on_hand
                sellable_stock
                reverse_stock
                ref_product_id
                ref_id
                sc_product_id
                product {
                    productAssets {
                        origin_image_url
                    }
                    id
                    name
                    store_id
                    status
                    platform_text_status
                    connector_channel_code
                    is_virtual
                    sync_status
                    variantAttributeValues {
                        scVariantValueAssets {
                            id
                            sme_url
                        }
                        value
                        id
                        position
                        sc_variant_attribute_id
                        sme_variant_attribute_value_id
                        ref_index
                    }

                    productAssets {
                        position
                        type
                        sme_url
                    }

                    productVariantAttributes {
                        id
                        name
                        sme_variant_attribute_id
                        values
                        ref_index
                        sc_attribute_id
                        position
                    }
                }
            }
        }

        sc_stores {
            connector_channel_code
            name
            id
            status
            special_type
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