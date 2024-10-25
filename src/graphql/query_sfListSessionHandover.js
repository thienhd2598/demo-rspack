import gql from 'graphql-tag';

export default gql`
    query sfListSessionHandover($page: Int!, $per_page: Int!, $search: SearchHandoverPickUp = {}) {
        sfListSessionHandover(page: $page, per_page: $per_page, search: $search) {
            list_record {
                code
                count_package
                count_package_valid
                created_by_obj
                created_at
                handover_at
                id
                print_status
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
