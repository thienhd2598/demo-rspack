import gql from 'graphql-tag';

export default gql`
    query sfSessionReceivedShippingCarrier ($is_shipping_carrier_default: Int) {
        sfSessionReceivedShippingCarrier (is_shipping_carrier_default: $is_shipping_carrier_default) {
            shipping_carrier
          }
    }
`;
