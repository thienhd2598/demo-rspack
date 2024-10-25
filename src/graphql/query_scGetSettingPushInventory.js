import gql from 'graphql-tag';

export default gql`
query scGetSettingPushInventory($page: Int!, $per_page: Int!, $store_id: Int, $search_variant: String) {
    scGetSettingPushInventory(page: $page, per_page: $per_page, store_id: $store_id, search_variant: $search_variant) {
        info_store {
            id
            name
            merge_stock
            type_push_inventory
            has_sync_warehouse
            enable_multi_warehouse
        }
        list_variant_push {
            total
            list_variant{
                id
                sku
                sc_product_attributes_value
                product {
                    id
                    name
                    price
                    productVariantAttributes {
                        id
                        name
                        position
                        ref_index
                        sc_attribute_id
                        sme_variant_attribute_id
                        values
                    }
                    productAssets {
                        type
                        template_image_url
                        ref_url
                        sme_url
                    }
                    variantAttributeValues {
                        id
                        value
                        ref_index
                        sc_variant_attribute_id
                        scVariantValueAssets {
                            id
                            sme_url
                        }
                    }
                }
                scProductVariantPushInventory{
                    id
                    inventory_push_percent
                    protection_threshold
                    scWarehouseMapping{
                        sme_warehouse_id
                        scWarehouse{
                            id
                            warehouse_name
                        }
                    }
                }
            }
        }
        list_warehouse_mapping {
            id
            inventory_push_percent
            sme_warehouse_id
            protection_threshold
            scWarehouse{
                id
                warehouse_name
            }
        }
        type_push
  }
}
`;
