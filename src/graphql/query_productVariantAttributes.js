import gql from 'graphql-tag';

export default gql`
    query sc_product($id: Int!) {
        sc_product(id: $id) {
            productVariantAttributes {
                id
                name
                sme_variant_attribute_id
                values
                ref_index
                sc_attribute_id
                position
            }
        }
    }
`;
