import gql from "graphql-tag";

export default gql`
  mutation configInvoiceSetting($date_type: String,$from_date: String,$is_auto: Int!,$order_status: String, $provider_connected_id: Int) {
    configInvoiceSetting(date_type: $date_type, from_date: $from_date, is_auto: $is_auto, order_status: $order_status, provider_connected_id: $provider_connected_id) {
      message
      success
    }
  }
`;

