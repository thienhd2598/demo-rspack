import gql from "graphql-tag";

export default gql`    
    mutation coImportWarehouse(
        $return_obj_id: Int!
        $import_note: String!
        $type_return: Int!
        $import_type: Int!
        $import_items: [ImportItemInput]
    ) {
        coImportWarehouse(
            return_obj_id: $return_obj_id
            import_note: $import_note
            type_return: $type_return
            import_type: $import_type
            import_items: $import_items
        ) {
        success
        message
        }
    }
`;