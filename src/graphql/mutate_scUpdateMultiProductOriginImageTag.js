import gql from 'graphql-tag';

export default gql`
    mutation scUpdateMultiProductOriginImageTag($products: [UpdateMultiProductOriginImageTag!] = {}) {
        scUpdateMultiProductOriginImageTag(products: $products) {
            message
            success
        }
    }
`;
