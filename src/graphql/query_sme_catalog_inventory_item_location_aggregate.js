import gql from 'graphql-tag';

export default gql`
query sme_catalog_inventory_items_aggregate($where: sme_catalog_inventory_item_locations_bool_exp) {
    sme_catalog_inventory_item_locations_aggregate(where: $where) {
        aggregate {
            count
        }
    }
}

`;
