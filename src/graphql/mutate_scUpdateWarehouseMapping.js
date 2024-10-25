import gql from 'graphql-tag';

export default gql`
    mutation scUpdateWarehouseMapping($mappings: [ScWarehouseMappingInput]!, $store_id: Int!) {
        scUpdateWarehouseMapping(mappings: $mappings, store_id: $store_id) {
            message
            success
        }
    }
`;