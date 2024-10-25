import gql from 'graphql-tag';

export default gql`
    mutation cfDeleteCostPeriod($cost_period_id: Int!) {
        cfDeleteCostPeriod(cost_period_id: $cost_period_id) {
            message
            success
        }
    }
`;