import gql from "graphql-tag";

export default gql`
  mutation coUpdateReturnOrderReason(
    $return_order_id: Int!
    $sme_reason_text: String!
    $sme_reason_type: Int!
  ) {
    coUpdateReturnOrderReason(
      return_order_id: $return_order_id
      sme_reason_text: $sme_reason_text
      sme_reason_type: $sme_reason_type
    ) {
      success
      message
    }
  }
`;