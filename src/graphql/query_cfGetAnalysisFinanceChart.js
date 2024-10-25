import gql from "graphql-tag";

export default gql`
  query cfGetAnalysisFinanceChart($compare_type: Float!, $date_type: Int!, $from_date: String!, $list_store_id: [Int], $order_type: String!, $to_date: String!, $connector_channel_code: [String!]!) {
    cfGetAnalysisFinanceChart(compare_type: $compare_type, date_type: $date_type, from_date: $from_date, order_type: $order_type, to_date: $to_date, list_store_id: $list_store_id, connector_channel_code: $connector_channel_code) {
        capital_price
        discount_sales
        fees_platform
        gross_profit
        amount_order
        marketing_costs
        net_revenue
        operating_costs
        profit
        profit_margin
        revenue_sell              
        label
    }
  }
`;
