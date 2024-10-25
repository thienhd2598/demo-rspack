import gql from "graphql-tag";

export default gql`
  query coGetShippingCarrier(
    $search: SearchOrder
  ) {
    coGetShippingCarrier(
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
