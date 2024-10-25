import gql from "graphql-tag";

export default gql`
  query coGetPaymentMethodFailDelivery(
    $search: SearchFailDeliveryOrder
  ) {
    coGetPaymentMethodFailDelivery(
      search: $search
    ) {
      success
      message
      data {
        payment_method
      }
    }
  }
`;
