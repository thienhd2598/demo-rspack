import gql from "graphql-tag";

export default gql`
  query coGetShippingCarrierFromListPackage(
    $search: SearchPackage
  ) {
    coGetShippingCarrierFromListPackage(
      search: $search
    ) {
      success
      message
      data {
        shipping_carrier
        number_package
      }
    }
  }
`;
