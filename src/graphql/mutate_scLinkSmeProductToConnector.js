import gql from 'graphql-tag';

export default gql`
mutation scLinkSmeProductToConnector($sc_product_id: Int!, $sme_product_id: String!, $sme_variant_id: String!, $variant_attributes: [ScLinkProductVariantAttributeInput!]) {
  scLinkSmeProductToConnector(link_product_data: {sme_product_id: $sme_product_id, sc_product_id: $sc_product_id, sme_variant_id: $sme_variant_id, variant_attributes: $variant_attributes}) {
    message
    success    
  }
}
`;