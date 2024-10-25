import gql from "graphql-tag";

export default gql`
    mutation coLinkSmeProductOrder(
        $order_item_id: Int!, 
        $sme_variant_id: String
    ) {
        coLinkSmeProductOrder (order_item_id: $order_item_id, sme_variant_id: $sme_variant_id) {
            message
            success
        }
    }
`;