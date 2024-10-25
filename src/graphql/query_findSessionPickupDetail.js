import gql from 'graphql-tag';

export default gql`
    query findSessionPickupDetail($id: Int!) {
        findSessionPickupDetail(id: $id) {
            code
            count_package
            count_product
            cancel_removed
            created_at
            id
            note
            pic_id
            total_purchased
            sme_id
            sme_warehouse_id
            print_export
            print_label
            print_pickup
            total_package_print_label
            total_package_print_export            
            status
            type
            updated_at
        }
    }
`