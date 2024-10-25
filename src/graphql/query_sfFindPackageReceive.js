import gql from 'graphql-tag';

export default gql`
    query sfFindPackageReceive($keyword: String) {
        sfFindPackageReceive(keyword: $keyword) {
            keyword
            object_id
            package_id
            object_ref_id
            object_tracking_number
            object_type
            shipping_carrier
            sf_received_code
            sf_received_id
            has_import_history
            store_id
        }
    }
`