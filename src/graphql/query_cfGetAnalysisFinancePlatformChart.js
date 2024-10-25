import gql from "graphql-tag";

export default gql`
  query cfGetAnalysisFinancePlatformChart($from_date: String!, $to_date: String!, $time_type: String!, $list_channel_code: [String]) {
    cfGetAnalysisFinancePlatformChart(from_date: $from_date, to_date: $to_date, list_channel_code: $list_channel_code, time_type: $time_type) {
        discount_sales {
            connector_channel_code
            items {
              key
              label
              value
            }
          }
          fees_platform {
            connector_channel_code
            items {
              key
              label
              value
            }
          }
          marketing_costs {
            connector_channel_code
            items {
              key
              label
              value
            }
          }
          operating_costs {
            connector_channel_code
            items {
              key
              label
              value
            }
          }
          revenue_costs {
            cost_allocation {
              connector_channel_code
              items {
              key
                label
                value
              }
            }
            revenue_costs_item {
              connector_channel_code
              expense
              revenue_sell
            }
        }    
    }   
  }
`;
