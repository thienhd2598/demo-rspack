import gql from 'graphql-tag';

export default gql`
mutation loginInvoicePartner($client_id: String!, $client_secret: String!, $partner_name: String!) {
    loginInvoicePartner(client_id: $client_id,client_secret: $client_secret,partner_name: $partner_name) {
    message
    success
  }
}
`;
