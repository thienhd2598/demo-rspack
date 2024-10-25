import gql from "graphql-tag";

export default gql`
  query CfGetFinancePlatformDashboardTable($from_date: String!, $to_date: String!, $time_type: String!, $list_channel_code: [String]) {
    CfGetFinancePlatformDashboardTable(from_date: $from_date, to_date: $to_date, list_channel_code: $list_channel_code, time_type: $time_type) {
         capital_price_gift {
            value
            group_channel {
              ratio
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              value
            }
          }
          capital_price_sell {
            value
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              ratio
              value
            }
          }
        money_about_wallet {
          value
          group_channel {
            channel_code
            group_store {
              ratio
              store_id
              value
            }
            ratio
            value
          }
        }
        capital_price {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              ratio
              value
            }
            value
          }
          amount_order {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              ratio
              value
            }
            value
          }
          discount_sales {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              ratio
              value
            }
            items {
              cost
              group_channel {
                channel_code
                group_store {
                  ratio
                  store_id
                  value
                }
                ratio
                value
              }
              label
            }
            value
          }
          fees_platform {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              value
              ratio
            }
            items {
              cost
              group_channel {
                channel_code
                group_store {
                  ratio
                  store_id
                  value
                }
                ratio
                value
              }
              label
            }
            value
          }
          gross_profit {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              ratio
              value
            }
            value
          }
          marketing_costs {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              ratio
              value
            }
            items {
              cost
              group_channel {
                channel_code
                group_store {
                  ratio
                  store_id
                  value
                }
                ratio
                value
              }
              label
            }
            value
          }
          net_revenue {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              value
              ratio
            }
            value
          }
          operating_costs {
            value
            group_channel {
              channel_code
              group_store {
                ratio
                value
                store_id
              }
              ratio
              value
            }
            items {
              cost
              group_channel {
                value
                ratio
                channel_code
                group_store {
                  ratio
                  store_id
                  value
                }
              }
              label
            }
          }
          profit {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              ratio
              value
            }
            value
          }
          profit_margin {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              ratio
              value
            }
            value
          }
          revenue_sell {
            group_channel {
              channel_code
              group_store {
                ratio
                store_id
                value
              }
              ratio
              value
            }
            value
          }
        }   
  }
`;
