import gql from "graphql-tag";

export default gql`
  mutation cfExportFinanceReport($from_date: String!, $to_date: String!, $time_type: String!, $list_channel_code: [String]) {
    cfExportFinanceReport(from_date: $from_date, to_date: $to_date, list_channel_code: $list_channel_code, time_type: $time_type) {
        link
        success
    }
  }
`;
