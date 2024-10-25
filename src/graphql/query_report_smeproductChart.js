import gql from 'graphql-tag';

export default gql`
    query report_smeproductChart($from: Int!, $to: Int!, $variant_id: String , $warehouses_ids: String ) {
    report_smeproductChart(from: $from, to: $to, variant_id: $variant_id, warehouses_ids: $warehouses_ids) {
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