import gql from 'graphql-tag';

export default gql`
    query sfSessionHandoverShippingCarrier {
        sfSessionHandoverShippingCarrier {
            shipping_carrier
        }
    }
`;
