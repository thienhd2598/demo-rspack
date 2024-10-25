import gql from "graphql-tag";

export default gql`
  mutation coPrintInvoice($list_order_id: [Int!]! = []) {
    coPrintInvoice(list_order_id: $list_order_id) {
      success
      message
      html_hd      
    }
  }
`;
