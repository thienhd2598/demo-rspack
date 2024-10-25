import gql from 'graphql-tag';

export default gql`
    mutation updateManualPackageLabel($order_id: Int!, $s3_document: String, $tracking_number: String!) {
        updateManualPackageLabel(order_id: $order_id, s3_document: $s3_document, tracking_number: $tracking_number) {
            list_fail {
                message
                order_id
            }
            message
            success
            total_fail
            total_success
        }
    }
`;