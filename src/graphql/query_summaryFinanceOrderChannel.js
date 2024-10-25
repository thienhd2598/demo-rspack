import gql from "graphql-tag";

export default gql`
  query summaryFinanceOrderChannel($from_date: String, $object_type: Int, $to_date: String, $time_type: String , $is_old_order: Int,) {
    summaryFinanceOrderChannel(from_date: $from_date, object_type: $object_type, to_date: $to_date, time_type: $time_type, is_old_order: $is_old_order) {
        connector_channel_code
        count_total
    }
  }
`;
