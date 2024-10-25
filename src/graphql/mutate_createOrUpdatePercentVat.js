import gql from 'graphql-tag';

export default gql`
    mutation createOrUpdatePercentVat($list_percent_vat: [PercentVat]!, $type: String!) {
        createOrUpdatePercentVat(list_percent_vat: $list_percent_vat, type: $type) {
            message
            success
        }
    }
`;