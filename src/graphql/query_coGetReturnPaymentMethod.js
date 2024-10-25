import gql from "graphql-tag";

export default gql`
  query coGetReturnPaymentMethod (
    $search: SearchReturnOrder
  ) {
    coGetReturnPaymentMethod (
        search: $search
    ) {
        success
        data{
            payment_method
        }
        message
    }
  }
`;
