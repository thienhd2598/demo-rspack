import gql from 'graphql-tag';

export default gql`
    mutation coLinkComboItem($combo_item_id: Int!, $sme_variant_id: String!) {
        coLinkComboItem(combo_item_id: $combo_item_id, sme_variant_id: $sme_variant_id) {
            success
            message
        }
    }
`;