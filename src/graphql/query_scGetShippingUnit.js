import gql from 'graphql-tag';

export default gql`
    query scGetShippingUnit {
        scGetShippingUnit {
            key
            name
        }
    }
`;