import gql from "graphql-tag";

export default gql`
  mutation cfExportAnalysisFinanceOverview($compare_type: Float!, $date_type: Int!, $from_date: String!, $list_store_id: [Int], $order_type: String!, $to_date: String!, $connector_channel_code: [String!]!) {
    cfExportAnalysisFinanceOverview(compare_type: $compare_type, date_type: $date_type, from_date: $from_date, order_type: $order_type, to_date: $to_date, list_store_id: $list_store_id, connector_channel_code: $connector_channel_code) {
        link
        success
    }
  }
`;
