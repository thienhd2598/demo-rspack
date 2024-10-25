import gql from "graphql-tag";

export default gql`
  query coGetPaymentMethodFromListPackage (
    $search: SearchPackage
  ) {
    coGetPaymentMethodFromListPackage (
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
