import gql from 'graphql-tag';

export default gql`
    mutation scUpdateSettingPushInventory(
        $list_variant_update: [InputVariantUpdate],
        $list_warehouse_update: [InputWareHouseUpdate],
        $merge_stock: Int!,
        $store_id: Int!,
        $type_push: Int!
    ) {
        scUpdateSettingPushInventory(
        list_variant_update: $list_variant_update, 
        list_warehouse_update: $list_warehouse_update, 
        merge_stock: $merge_stock,
        store_id: $store_id,
        type_push: $type_push) {
            success
            message
        }
    }
`;