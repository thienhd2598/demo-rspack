import gql from 'graphql-tag';

export default gql`
    query sfGetListPackageReceive($page: Int!, $per_page: Int!, $type_keyword: String!, $keyword: String) {
        sfGetListPackageReceive(page: $page, per_page: $per_page, type_keyword: $type_keyword, keyword: $keyword) {
            list_record {
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
            total
        }
    }
`;
