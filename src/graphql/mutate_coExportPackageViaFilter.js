import gql from "graphql-tag";

export default gql`    
    mutation coExportPackageViaFilter(
    $list_id: [Int],
    $search: SearchPackage
    ) {
        coExportPackageViaFilter(
         list_id: $list_id
         search: $search
        ) {
         file_name
         message
         success
         url
        }
    }
`;