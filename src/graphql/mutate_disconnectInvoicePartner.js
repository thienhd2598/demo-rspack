import gql from 'graphql-tag';

export default gql`
    mutation disconnectInvoicePartner($partner_name: String!) {
        disconnectInvoicePartner(partner_name: $partner_name) {
            message
            success
        }
    }
`;
