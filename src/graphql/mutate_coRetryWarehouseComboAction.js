import gql from "graphql-tag";

export default gql`
  mutation coRetryWarehouseComboAction($combo_item_id: Int! ) {
    coRetryWarehouseComboAction(combo_item_id: $combo_item_id) {
      success
      message
    }
  }
`;
