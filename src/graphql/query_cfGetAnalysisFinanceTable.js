import gql from "graphql-tag";

export default gql`
  query cfGetAnalysisFinanceTable($compare_type: Float!, $date_type: Int!, $from_date: String!, $list_store_id: [Int], $order_type: String!, $to_date: String!, $connector_channel_code: [String!]!) {
    cfGetAnalysisFinanceTable(compare_type: $compare_type, date_type: $date_type, from_date: $from_date, order_type: $order_type, to_date: $to_date, list_store_id: $list_store_id, connector_channel_code: $connector_channel_code) {
        capital_price
        compare_capital_price
        compare_gross_profit
        compare_net_revenue
        compare_profit
        amount_order
        compare_amount_order
        amount_order_growth  
        compare_profit_margin
        compare_revenue_sell
        compare_money_about_wallet
        money_about_wallet
        money_about_wallet_growth
        capital_price_growth
        gross_profit_growth
        net_revenue_growth
        profit_growth
        profit_margin_growth
        revenue_sell_growth
        previous_label
        discount_sales {
            compare_value
            growth
            items {
                compare_cost
                cost
                label
                growth
            }
            value
        }
        fees_platform {
            compare_value
            growth
            items {
                compare_cost
                growth
                cost
                label
            }
            value
        }
        gross_profit
        marketing_costs {
            growth
            compare_value
            items {
                growth
                compare_cost
                cost
                label
            }
            value
        }
        net_revenue
        operating_costs {
            compare_value
            growth
            items {
                growth
                compare_cost
                cost
                label
            }
            value
        }
        profit
        profit_margin
        revenue_sell
    }    
  }
`;
