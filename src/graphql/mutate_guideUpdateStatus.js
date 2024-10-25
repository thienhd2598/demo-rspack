import gql from 'graphql-tag';

export default gql`
    mutation guideUpdateStatus($type: String!, $value: Int!) {
        guideUpdateStatus(type: $type, value: $value) {
            status_inventory_handling_enabled
            status_linked_product_exists
            status_linked_shop_exists
            status_sme_product_exists
        }
    }
`;
