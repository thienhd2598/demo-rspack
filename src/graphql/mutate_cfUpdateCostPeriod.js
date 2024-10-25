import gql from 'graphql-tag';

export default gql`
    mutation cfUpdateCostPeriod(
        $cost_period_id: Int!,
        $cost: Float!,
        $cost_before_vat: Float!,
        $percent_vat: Int!,
        $cost_label: String!, 
        $method: Int!, 
        $name: String!,
        $stores: [Stores],
        $time_from: String!,
        $time_to: String!,
        $type: Int!
    ) {
        cfUpdateCostPeriod(cost_period_id: $cost_period_id,percent_vat:$percent_vat, cost_before_vat: $cost_before_vat, cost: $cost, cost_label: $cost_label, method: $method, name: $name, time_from: $time_from, time_to: $time_to, type: $type, stores: $stores) {
            cost_period_id
            message
            success
        }
    }
`;