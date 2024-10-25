import gql from "graphql-tag";

export default gql`
  mutation coUpdateOrderNote($list_order_id: [Int!]!, $sme_note: String) {
    coUpdateOrderNote(list_order_id: $list_order_id, sme_note: $sme_note) {
      success
      message
    }
  }
`;
