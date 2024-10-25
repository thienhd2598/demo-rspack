import gql from 'graphql-tag';

export default gql`
    query detail_cost_period($id: Int!) {
        detail_cost_period(id: $id) {
            cost
            cost_label
            dailyCostPeriod {
                connector_channel_code
                cost
                cost_label
                id
                method
                name
                report_time
                store_id
                type
                type_time
            }
            id
            method
            name
            time_from
            time_to
            type   
        }
    }
`