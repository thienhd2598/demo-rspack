import gql from 'graphql-tag';

export default gql`
    query list_cost_period($first: Int! = 25, $page: Int, $type: [Int], $search_time: [String]) {
        list_cost_period(first: $first, page: $page, type: $type, search_time: $search_time) {
            data {
                cost
                cost_before_vat
                percent_vat
                cost_label
                id
                method
                name
                stores {
                  connector_channel_code
                  id
                }
                time_from
                time_to
                type
                dailyCostPeriod {
                    connector_channel_code
                    cost
                    cost_label
                    id
                    method
                    name
                    report_time
                    store {
                        id
                        name
                    }
                    store_id
                    type
                    type_time
                }
            }
            paginatorInfo {
                count
                currentPage
                firstItem
                hasMorePages
                lastItem
                lastPage
                perPage
                total
            }
        }
    }
`;
