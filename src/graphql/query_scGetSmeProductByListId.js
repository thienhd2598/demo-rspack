import gql from 'graphql-tag';

export default gql`
    query scGetSmeProductByListId($list_product_id: [Int]) {
        scGetSmeProductByListId(list_product_id: $list_product_id) {
            id
            productVariants {
                id
                price
                price_minimum
                sku
                is_enable_link_inventory
                stock_on_hand
                reverse_stock
                sellable_stock
                sme_product_variant_id
                variantInventoris {
                    id
                    inventory_change
                    sc_variant_id
                    sc_warehouse_id
                    stock_on_hand
                    store_id
                }
            }
            productAssets {
                origin_image_url
            }
            store_id
        }
    }
`;