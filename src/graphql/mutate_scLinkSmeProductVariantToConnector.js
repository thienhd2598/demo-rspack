import gql from 'graphql-tag';

export default gql`
mutation scLinkSmeProductVariantToConnector($sc_variant_id: Int!, $sme_variant_id: String!) {
  scLinkSmeProductVariantToConnector(sc_variant_id: $sc_variant_id, sme_variant_id: $sme_variant_id) {
    message
    success    
  }
}
`;