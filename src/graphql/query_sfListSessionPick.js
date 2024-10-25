import gql from 'graphql-tag';

export default gql`
    query sfListSessionPick($page: Int!, $per_page: Int!, $search: SearchSessionPickUp = {}) {
        sfListSessionPick(page: $page, per_page: $per_page, search: $search) {
            list_record {
                code
                count_package
                total_packaged
                count_product                
                id
                note
                sme_id
                pic_id
                sme_warehouse_id
                status
                type
                created_at
                updated_at
            }
            total
        }
    }
`;
