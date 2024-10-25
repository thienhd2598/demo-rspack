import gql from 'graphql-tag';

export default gql`
    query report_scproductChart($from: Int!, $to: Int!, $variant_id: String) {
    report_scproductChart(from: $from, to: $to, variant_id: $variant_id) {
            color
            defaultSelected
            description
            increase
            title
            tooltip
            unit
            value
            data {
                cancel
                label
                return
                time
                value
        }
    }
}

`