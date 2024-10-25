import gql from "graphql-tag";

export default gql`
  mutation coReloadOrderShipmentParam($list_sc_order_id: [Int!]!) {
    coReloadOrderShipmentParam(
      list_sc_order_id: $list_sc_order_id
    ) {
      success
      message
    }
  }
`;
