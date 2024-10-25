import gql from 'graphql-tag';

export default gql`
query sme_catalog_inventory_item_locations($where: sme_catalog_inventory_item_locations_bool_exp,$order_by: [sme_catalog_inventory_item_locations_order_by!],  $limit: Int, $offset: Int) {
  sme_catalog_inventory_item_locations(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
    product_id
    created_at
    empty_at
    expired_at
    expired_warning_at
    id
    inbound_at
    location_code
    location_id
    location_type
    lot_number
    stock_actual
    manufacture_at
    variant {
        id
        attributes {
            id
            sme_catalog_product_attribute_value {
                name
            }
        }
        name
        sku
        sme_catalog_product {
            name
        }
        sme_catalog_product_variant_assets {
            asset_url
        }
        }
        stop_sale_at
        warehouse {
            name
            id
        }
    }
    sme_catalog_inventory_item_locations_aggregate(where: $where) {
        aggregate {
            count
        }
    }
}
`;
