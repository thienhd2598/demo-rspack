import gql from "graphql-tag";

export default gql`
  query coGetPaymentMethod(
    $search: SearchOrder
  ) {
    coGetPaymentMethod(
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
