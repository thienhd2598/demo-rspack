import gql from 'graphql-tag';

export default gql`
mutation scUnLinkSmeProductVariantToConnector($sc_variant_id: Int!) {
  scUnLinkSmeProductVariantToConnector(sc_variant_id: $sc_variant_id) {
    message
    success    
  }
}
`;