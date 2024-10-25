import gql from 'graphql-tag';

export default gql`
    mutation sfPrintPickup($id: Int!, $print_type: Int!) {
        sfPrintPickup(id: $id, print_type: $print_type) {
            html
            message
            success
        }
    }
`;