import gql from 'graphql-tag';

export default gql`
    query sfListSessionReceived($page: Int!, $per_page: Int!, $search: SearchSessionReceived = {}) {
        sfListSessionReceived(page: $page, per_page: $per_page, search: $search) {
            list_record {
                code
                count_package
                count_imported
                created_at
                created_by_obj
                received_at
                id                
                shipping_carrier
                sme_id
                sme_warehouse_id
                status
                updated_at
            }
            total
        }
    }
`;
