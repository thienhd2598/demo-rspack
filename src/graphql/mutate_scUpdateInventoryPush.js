import gql from 'graphql-tag';

export default gql`
    mutation scUpdateInventoryPush($inventory_push_rules: [ScInventoryPushInput]!, $store_id: Int!) {
        scUpdateInventoryPush(inventory_push_rules: $inventory_push_rules, store_id: $store_id) {
            message
            success
        }
    }
`;