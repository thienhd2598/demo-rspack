import gql from 'graphql-tag';

export default gql`
mutation scUnLinkSmeProductToConnector($sc_product_id: Int!, $sme_product_id: String!) {
    scUnLinkSmeProductToConnector(sc_product_id: $sc_product_id, sme_product_id: $sme_product_id) {
    message
    success    
  }
}
`;